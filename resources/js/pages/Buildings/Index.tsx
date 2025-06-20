import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    LayoutGrid, Table as TableIcon, Plus, Edit, Trash2, UploadCloud,
    ChevronLeft, ChevronRight, Archive, MapPin, ArchiveRestore,
    ChevronDown, MoreHorizontal, Download, Building as IconBuilding,
    User, Search, Filter, FileSpreadsheet, X, Check, AlertCircle
} from 'lucide-react';
import * as XLSX from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building } from '@/types/models/Building';

// TypeScript interfaces for better type safety
interface Doorman {
    id?: number;
    name: string;
    photo: string | null;
    email: string;
    phone: string;
    shift: 'morning' | 'afternoon' | 'night';
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationMeta {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
    links: PaginationLink[];
}

interface Props {
    buildings: {
        data: Building[];
        links: PaginationLink[];
        meta: PaginationMeta;
    };
    googleMapsApiKey: string;
}

export default function Index({ buildings, googleMapsApiKey }: Props) {
    // Estados para la tabla
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    const [globalFilter, setGlobalFilter] = useState('');

    // Estados para la vista y modales
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showConfirmClose, setShowConfirmClose] = useState(false);
    const [currentBuilding, setCurrentBuilding] = useState<Building | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState<number | null>(null);
    const [gridColumns, setGridColumns] = useState<number>(4);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Formulario
    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        id: null as number | null,
        name: '',
        image: null as File | null,
        description: '',
        location_link: '',
        owner: {
            name: '',
            email: '',
            photo: null as File | null,
            phone: ''
        },
        doormen: [] as Array<{
            id?: number;
            name: string;
            photo: File | null;
            email: string;
            phone: string;
            shift: 'morning' | 'afternoon' | 'night';
        }>,
    });

    // Helper functions for unsaved changes detection
    const checkForUnsavedChanges = () => {
        const hasData = data.name.trim() !== '' || 
                       data.description.trim() !== '' || 
                       data.location_link.trim() !== '' ||
                       data.owner.name.trim() !== '' ||
                       data.owner.email.trim() !== '' ||
                       data.owner.phone.trim() !== '' ||
                       data.doormen.length > 0 ||
                       data.image !== null ||
                       data.owner.photo !== null;
        
        setHasUnsavedChanges(hasData);
        return hasData;
    };

    // Handle modal close with confirmation
    const handleCloseModal = () => {
        if (checkForUnsavedChanges()) {
            setShowConfirmClose(true);
        } else {
            closeModalAndReset();
        }
    };

    const closeModalAndReset = () => {
        setShowCreateModal(false);
        setShowConfirmClose(false);
        setCurrentBuilding(null);
        setHasUnsavedChanges(false);
        reset();
    };

    const confirmDiscardChanges = () => {
        closeModalAndReset();
    };

    // Enhanced setData wrapper to track changes
    const setFormData = (field: string, value: unknown) => {
        setData(field as keyof typeof data, value);
        setTimeout(() => checkForUnsavedChanges(), 0);
    };

    // Definición de columnas para la tabla
    const columns: ColumnDef<Building>[] = [
        {
            accessorKey: "image",
            header: "Image",
            enableSorting: false,
            cell: ({ row }) => {
                const building = row.original;
                return building.image ? (
                    <img
                        src={`/storage/${building.image}`}
                        alt={building.name}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <IconBuilding className="w-5 h-5 text-gray-400" />
                    </div>
                );
            },
        },
        {
            accessorKey: "name",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 p-0 font-semibold text-left justify-start group hover:bg-transparent dark:!bg-transparent hover:text-black dark:!text-white"
                    >
                        Name
                        {column.getIsSorted() === "asc" ? (
                            <ChevronDown className="ml-2 h-4 w-4 rotate-180" />
                        ) : column.getIsSorted() === "desc" ? (
                            <ChevronDown className="ml-2 h-4 w-4" />
                        ) : (
                            <ChevronDown className="ml-2 h-4 w-4 opacity-20" />
                        )}
                    </Button>
                )
            },
            cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
        },
        {
            accessorKey: "status",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 p-0 font-semibold text-left justify-start group hover:bg-transparent dark:!bg-transparent hover:text-black dark:!text-white"
                    >
                        Status
                        {column.getIsSorted() === "asc" ? (
                            <ChevronDown className="ml-2 h-4 w-4 rotate-180 dark:group-hover:!text-white" />
                        ) : column.getIsSorted() === "desc" ? (
                            <ChevronDown className="ml-2 h-4 w-4 dark:group-hover:!text-white" />
                        ) : (
                            <ChevronDown className="ml-2 h-4 w-4 opacity-20 dark:group-hover:!text-white" />
                        )}
                    </Button>
                )
            },
            cell: ({ row }) => {
                const building = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={building.status}
                            onCheckedChange={() => toggleStatus(building)}
                            className="data-[state=checked]:bg-green-500"
                            disabled={isUpdatingStatus === building.id}
                        />
                        <StatusBadge status={building.status ? "active" : "inactive"} />
                    </div>
                );
            },
        },
        {
            accessorKey: "description",
            header: "Description",
            enableSorting: false,
            cell: ({ row }) => (
                <div className="max-w-[200px] truncate">
                    {row.getValue("description") || "No description"}
                </div>
            ),
        },
        {
            accessorKey: "created_at",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="h-8 p-0 font-semibold text-left justify-start group hover:bg-transparent dark:!bg-transparent hover:text-black dark:!text-white"
                    >
                        Created At
                        {column.getIsSorted() === "asc" ? (
                            <ChevronDown className="ml-2 h-4 w-4 rotate-180" />
                        ) : column.getIsSorted() === "desc" ? (
                            <ChevronDown className="ml-2 h-4 w-4" />
                        ) : (
                            <ChevronDown className="ml-2 h-4 w-4 opacity-20" />
                        )}
                    </Button>
                )
            },
            cell: ({ row }) => (
                <div className="text-sm text-gray-500">
                    {new Date(row.getValue("created_at")).toLocaleDateString()}
                </div>
            ),
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const building = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(building)} className='group'>
                                <Edit className="mr-2 h-4 w-4 group-hover:text-white dark:group-hover:text-primary-foreground" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleStatus(building)}>
                                {building.status ? (
                                    <>
                                        <Archive className="mr-2 h-4 w-4 group-hover:text-white dark:group-hover:text-primary-foreground" />
                                        Archive
                                    </>
                                ) : (
                                    <>
                                        <ArchiveRestore className="mr-2 h-4 w-4 group-hover:text-white dark:group-hover:text-primary-foreground" />
                                        Restore
                                    </>
                                )}
                            </DropdownMenuItem>
                            {building.location_link && (
                                <DropdownMenuItem onClick={() => showLocation(building)} className='group'>
                                    <MapPin className="mr-2 h-4 w-4 group-hover:text-white dark:group-hover:text-primary-foreground" />
                                    View Location
                                </DropdownMenuItem>
                            )}
                            {!building.status && (
                                <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleDelete(building)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    // Funciones para manejar la paginación del servidor
    const handlePageChange = (page: number) => {
        const currentUrl = window.location.pathname + window.location.search;
        const url = new URL(currentUrl, window.location.origin);
        url.searchParams.set('page', page.toString());
        router.visit(url.toString(), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePageSizeChange = (pageSize: number) => {
        const currentUrl = window.location.pathname + window.location.search;
        const url = new URL(currentUrl, window.location.origin);
        url.searchParams.set('per_page', pageSize.toString());
        url.searchParams.set('page', '1'); // Reset to first page when changing page size
        router.visit(url.toString(), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Configuración de la tabla
    const table = useReactTable({
        data: buildings.data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: 'includesString',
        // No usar paginación de React Table ya que usamos la del servidor
        manualPagination: true,
        pageCount: buildings.meta.last_page,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter,
            pagination: {
                pageIndex: buildings.meta.current_page - 1, // React Table usa 0-based indexing
                pageSize: buildings.meta.per_page,
            },
        },
    });

    // Funciones para exportar datos
    const exportToCSV = () => {
        const visibleColumns = table.getAllColumns()
            .filter(column => column.getIsVisible() && column.id !== 'actions')
            .map(column => ({
                id: column.id,
                header: typeof column.columnDef.header === 'string' 
                    ? column.columnDef.header 
                    : column.id.charAt(0).toUpperCase() + column.id.slice(1)
            }));

        const headers = visibleColumns.map(col => col.header).join(',') + '\n';

        const rows = table.getFilteredRowModel().rows.map(row => {
            return visibleColumns.map(column => {
                const value = row.getValue(column.id);
                // Formatear valores para CSV
                if (column.id === 'status') {
                    return row.original.status ? 'Active' : 'Inactive';
                }
                if (column.id === 'created_at') {
                    return new Date(row.original.created_at).toLocaleDateString();
                }
                if (column.id === 'image') {
                    return row.original.image ? 'Yes' : 'No';
                }
                return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value || '';
            })
            .join(',');
        }).join('\n');

        const csv = headers + rows;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `buildings_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('CSV exported successfully!');
    };

    const exportToExcel = async () => {
        try {
            const workbook = new XLSX.Workbook();
            const sheet = workbook.addWorksheet('Buildings Report');

            // Corporate colors matching your design system
            const colors = {
                primary: 'FF0F172A',      // slate-900
                secondary: 'FF64748B',    // slate-500
                accent: 'FF06B6D4',       // cyan-500
                success: 'FF10B981',      // emerald-500
                warning: 'FFF59E0B',      // amber-500
                danger: 'FFEF4444',       // red-500
                info: 'FF3B82F6',         // blue-500
                dark: 'FF1E293B',         // slate-800
                light: 'FFF8FAFC'         // slate-50
            };

            // Calculate statistics
            const totalBuildings = buildings.data.length;
            const activeBuildings = buildings.data.filter(b => b.status).length;
            const archivedBuildings = totalBuildings - activeBuildings;
            const totalApartments = buildings.data.reduce((sum, b) => sum + (b.apartments?.length || 0), 0);
            const totalDoormen = buildings.data.reduce((sum, b) => sum + (b.doormen?.length || 0), 0);
            const avgApartmentsPerBuilding = totalBuildings > 0 ? (totalApartments / totalBuildings).toFixed(1) : '0';

            // Company header
            sheet.mergeCells('A1:H1');
            const titleCell = sheet.getCell('A1');
            titleCell.value = 'BUILDINGS MANAGEMENT REPORT';
            titleCell.style = {
                font: { name: 'Segoe UI', size: 18, bold: true, color: { argb: 'FFFFFFFF' } },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.primary } },
                alignment: { horizontal: 'center', vertical: 'middle' },
                border: {
                    top: { style: 'medium', color: { argb: colors.primary } },
                    left: { style: 'medium', color: { argb: colors.primary } },
                    bottom: { style: 'medium', color: { argb: colors.primary } },
                    right: { style: 'medium', color: { argb: colors.primary } }
                }
            };
            sheet.getRow(1).height = 40;

            // Report metadata
            sheet.mergeCells('A2:H2');
            const metaCell = sheet.getCell('A2');
            metaCell.value = `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`;
            metaCell.style = {
                font: { name: 'Segoe UI', size: 10, italic: true, color: { argb: colors.secondary } },
                alignment: { horizontal: 'center', vertical: 'middle' },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.light } }
            };
            sheet.getRow(2).height = 20;

            // Statistics section
            const stats = [
                ['📊 BUILDINGS OVERVIEW', '', '', '', '', ''],
                ['Total Buildings', totalBuildings, 'Active Buildings', activeBuildings, 'Archived Buildings', archivedBuildings],
                ['Total Apartments', totalApartments, 'Total Doormen', totalDoormen, 'Avg Apartments/Building', avgApartmentsPerBuilding]
            ];

            let currentRow = 4;
            stats.forEach((statRow, index) => {
                if (index === 0) {
                    // Header row
                    sheet.mergeCells(`A${currentRow}:H${currentRow}`);
                    const headerCell = sheet.getCell(`A${currentRow}`);
                    headerCell.value = statRow[0];
                    headerCell.style = {
                        font: { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFFFFFFF' } },
                        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.info } },
                        alignment: { horizontal: 'center', vertical: 'middle' }
                    };
                } else {
                    // Data rows
                    statRow.forEach((value, colIndex) => {
                        const cell = sheet.getCell(currentRow, colIndex + 1);
                        cell.value = value;
                        cell.style = {
                            font: { name: 'Segoe UI', size: 10, bold: colIndex % 2 === 0, color: { argb: colIndex % 2 === 0 ? colors.dark : colors.info } },
                            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colIndex % 2 === 0 ? 'FFF1F5F9' : 'FFFFFFFF' } },
                            alignment: { horizontal: colIndex % 2 === 0 ? 'left' : 'center', vertical: 'middle' },
                            border: {
                                top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                                left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                                bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                                right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
                            }
                        };
                    });
                }
                currentRow++;
            });

            currentRow += 2; // Space before data table

            // Data headers
            const headers = ['ID', 'Building Name', 'Description', 'Status', 'Apartments', 'Doormen', 'Owner', 'Created Date'];
            
            headers.forEach((header, index) => {
                const cell = sheet.getCell(currentRow, index + 1);
                cell.value = header;
                cell.style = {
                    font: { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
                    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.dark } },
                    alignment: { horizontal: 'center', vertical: 'middle' },
                    border: {
                        top: { style: 'medium', color: { argb: colors.dark } },
                        left: { style: 'thin', color: { argb: colors.dark } },
                        bottom: { style: 'medium', color: { argb: colors.dark } },
                        right: { style: 'thin', color: { argb: colors.dark } }
                    }
                };
            });
            sheet.getRow(currentRow).height = 30;
            currentRow++;

            // Data rows
            buildings.data.forEach((building, index) => {
                const status = building.status ? 'Active' : 'Archived';
                const apartmentCount = building.apartments?.length || 0;
                const doormenCount = building.doormen?.length || 0;
                const ownerName = building.owner?.name || 'N/A';
                const createdDate = new Date(building.created_at).toLocaleDateString();

                const rowData = [
                    building.id,
                    building.name || 'N/A',
                    building.description || 'N/A',
                    status,
                    apartmentCount,
                    doormenCount,
                    ownerName,
                    createdDate
                ];

                rowData.forEach((value, colIndex) => {
                    const cell = sheet.getCell(currentRow, colIndex + 1);
                    cell.value = value;
                    
                    let fillColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
                    let fontColor = colors.dark;

                    // Status column styling
                    if (colIndex === 3) {
                        if (value === 'Active') {
                            fillColor = colors.success;
                            fontColor = 'FFFFFFFF';
                        } else {
                            fillColor = colors.warning;
                            fontColor = 'FFFFFFFF';
                        }
                    }

                    // Apartment count styling
                    if (colIndex === 4) {
                        if (apartmentCount > 10) {
                            fillColor = 'FF10B981'; // Verde sólido
                            fontColor = 'FFFFFFFF';
                        } else if (apartmentCount > 5) {
                            fillColor = 'FFF59E0B'; // Amarillo sólido
                            fontColor = 'FFFFFFFF';
                        } else if (apartmentCount > 0) {
                            fillColor = 'FF3B82F6'; // Azul sólido
                            fontColor = 'FFFFFFFF';
                        } else {
                            fillColor = 'FFEF4444'; // Rojo sólido
                            fontColor = 'FFFFFFFF';
                        }
                    }

                    cell.style = {
                        font: { name: 'Segoe UI', size: 10, color: { argb: fontColor } },
                        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } },
                        alignment: { horizontal: colIndex === 1 || colIndex === 2 || colIndex === 6 ? 'left' : 'center', vertical: 'middle' },
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

            // Set column widths
            sheet.columns = [
                { width: 8 }, { width: 25 }, { width: 30 }, { width: 12 }, 
                { width: 12 }, { width: 12 }, { width: 20 }, { width: 15 }
            ];

            // Summary row
            currentRow += 1;
            sheet.mergeCells(`A${currentRow}:H${currentRow}`);
            const summaryCell = sheet.getCell(`A${currentRow}`);
            summaryCell.value = `📋 Summary: ${totalBuildings} buildings total (${activeBuildings} active, ${archivedBuildings} archived) with ${totalApartments} apartments managed by ${totalDoormen} doormen`;
            summaryCell.style = {
                font: { name: 'Segoe UI', size: 10, italic: true, color: { argb: colors.secondary } },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.light } },
                alignment: { horizontal: 'center', vertical: 'middle' },
                border: {
                    top: { style: 'medium', color: { argb: 'FFE2E8F0' } },
                    left: { style: 'medium', color: { argb: 'FFE2E8F0' } },
                    bottom: { style: 'medium', color: { argb: 'FFE2E8F0' } },
                    right: { style: 'medium', color: { argb: 'FFE2E8F0' } }
                }
            };

            // Generate and save file
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            
            const timestamp = new Date().toISOString().split('T')[0];
            saveAs(blob, `buildings_management_report_${timestamp}.xlsx`);
            toast.success('📊 Buildings report exported successfully!');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            toast.error('Error exporting to Excel. Please try again.');
        }
    };

    // Funciones para manejar edificios
    const toggleStatus = async (building: Building) => {
        setIsUpdatingStatus(building.id);
        try {
            await router.put(
                route('buildings.update-status', building.id),
                { status: !building.status },
                {
                    preserveScroll: true,
                    onSuccess: () => toast.success('Status updated successfully'),
                    onError: () => toast.error('Connection error')
                }
            );
        } finally {
            setIsUpdatingStatus(null);
        }
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        // Building data
        formData.append('name', data.name);
        if (data.image) formData.append('image', data.image);
        formData.append('description', data.description);
        formData.append('location_link', data.location_link);

        // Owner data
        formData.append('owner[name]', data.owner.name);
        formData.append('owner[email]', data.owner.email);
        formData.append('owner[phone]', data.owner.phone);
        if (data.owner.photo) formData.append('owner[photo]', data.owner.photo);

        // Doormen data
        data.doormen.forEach((doorman, index) => {
            formData.append(`doormen[${index}][name]`, doorman.name);
            formData.append(`doormen[${index}][email]`, doorman.email);
            formData.append(`doormen[${index}][phone]`, doorman.phone);
            formData.append(`doormen[${index}][shift]`, doorman.shift);
            if (doorman.id) formData.append(`doormen[${index}][id]`, doorman.id.toString());
            if (doorman.photo) formData.append(`doormen[${index}][photo]`, doorman.photo);
        });

        post(route('buildings.store'), {
            data: formData,
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowCreateModal(false);
                toast.success('Building created successfully');
            },
            onError: (errors) => {
                console.error('Errors:', errors);
                Object.values(errors).forEach(error => toast.error(error));
            }
        });
    };

    const handleEdit = (building: Building) => {
        setData({
            id: building.id,
            name: building.name,
            image: null,
            description: building.description,
            location_link: building.location_link,
            owner: {
                name: building.owner.name,
                email: building.owner.email,
                photo: null,
                phone: building.owner.phone || ''
            },
            doormen: building.doormen.map(d => ({
                id: d.id,
                name: d.name,
                photo: null,
                email: d.email,
                phone: d.phone || '',
                shift: d.shift || 'morning'
            }))
        });
        setCurrentBuilding(building);
        setShowCreateModal(true);
    };

    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.id) return;

        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('name', data.name);
        if (data.image) formData.append('image', data.image);
        formData.append('description', data.description);
        formData.append('location_link', data.location_link);

        // Owner data
        formData.append('owner[name]', data.owner.name);
        formData.append('owner[email]', data.owner.email);
        formData.append('owner[phone]', data.owner.phone);
        if (data.owner.photo) formData.append('owner[photo]', data.owner.photo);

        // Doormen data
        data.doormen.forEach((doorman, index) => {
            formData.append(`doormen[${index}][name]`, doorman.name);
            formData.append(`doormen[${index}][email]`, doorman.email);
            formData.append(`doormen[${index}][phone]`, doorman.phone);
            formData.append(`doormen[${index}][shift]`, doorman.shift);
            if (doorman.id) formData.append(`doormen[${index}][id]`, doorman.id.toString());
            if (doorman.photo) formData.append(`doormen[${index}][photo]`, doorman.photo);
        });

        router.post(route('buildings.update', data.id), formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowCreateModal(false);
                setCurrentBuilding(null);
                toast.success('Building updated successfully');
            },
            onError: (errors) => {
                Object.values(errors).forEach(error => toast.error(error));
            }
        });
    };

    const handleDelete = (building: Building) => {
        setCurrentBuilding(building);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!currentBuilding) return;

        destroy(route('buildings.destroy', currentBuilding.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowDeleteModal(false);
                setCurrentBuilding(null);
                toast.success('Building deleted successfully');
            },
            onError: () => {
                toast.error('Error deleting building');
            }
        });
    };

    const showLocation = (building: Building) => {
        setCurrentBuilding(building);
        setShowLocationModal(true);
    };

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

            const placeIdMatch = locationLink.match(/place\/([^\/]+)/);
            if (placeIdMatch) {
                return `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=place_id:${placeIdMatch[1]}`;
            }
        }

        return `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${encodeURIComponent(locationLink)}`;
    };

    // Vista de cuadrícula
    const GridView = ({ buildings, onEdit, onDelete, onToggleStatus, isUpdatingStatus, gridColumns, onShowLocation }: {
        buildings: Building[],
        onEdit: (building: Building) => void,
        onDelete: (building: Building) => void,
        onToggleStatus: (building: Building) => void,
        isUpdatingStatus: number | null,
        gridColumns: number,
        onShowLocation: (building: Building) => void
    }) => {
        const getGridClass = () => {
            switch (gridColumns) {
                case 2: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2';
                case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
                case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
                case 5: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5';
                case 6: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-6';
                default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
            }
        };
        const [selectedDoorman, setSelectedDoorman] = useState<Doorman | null>(null);
        const [openBuildingId, setOpenBuildingId] = useState<number | null>(null);

        return (
            <div className={`grid ${getGridClass()} gap-8`}>
                {buildings.map((building) => (
                    <div key={building.id} className="group relative bg-gradient-to-br from-background via-muted/20 to-background rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-border/50 hover:border-primary/30 overflow-hidden backdrop-blur-sm">
                        {/* Status Indicator */}
                        <div className={`absolute text-primary-foreground top-4 left-4 z-10 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md ${
                            building.status 
                                ? 'bg-accent/20 text-accent border border-accent/30' 
                                : 'bg-muted/30 text-muted-foreground border border-muted/50'
                        }`}>
                            {building.status ? 'Active' : 'Archived'}
                        </div>

                        {/* Enhanced Location Button */}
                        {building.location_link && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onShowLocation(building)}
                                className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-md border-2 border-red-500/30 hover:bg-gradient-to-br hover:from-red-500/30 hover:to-red-600/30 hover:border-red-500/50 hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl group/location"
                                title="View Location on Map"
                            >
                                <div className="relative">
                                    <MapPin className="w-6 h-6 text-red-600 transition-transform duration-300 group-hover/location:scale-110 drop-shadow-sm" />
                                    {/* Animated pulse dot */}
                                </div>
                            </Button>
                        )}

                        {/* Image Container */}
                        <div className="relative overflow-hidden">
                            <div className="aspect-[4/3] overflow-hidden">
                                <img
                                    src={`/storage/${building.image}`}
                                    alt={building.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                        e.currentTarget.src = '/images/default-builder-square.png';
                                    }}
                                />
                            </div>
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-1">
                                        {building.name}
                                    </h3>
                                    {building.description && (
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                            {building.description}
                                        </p>
                                    )}
                                </div>

                                {/* Doormen Counter */}
                                <div className="relative ml-4">
                                    <button
                                        onClick={() => setOpenBuildingId(openBuildingId === building.id ? null : building.id)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-all duration-300 hover:scale-105"
                                    >
                                        <span className="text-sm font-semibold text-primary">{building.doormen.length}</span>
                                        <User className="w-4 h-4 text-primary" />
                                    </button>

                                    {/* Doormen List */}
                                    {openBuildingId === building.id && (
                                        <div className="absolute right-0 top-full mt-3 z-30 space-y-3 animate-in slide-in-from-top-2">
                                            {building.doormen.map((doorman, index) => (
                                                <div
                                                    key={doorman.id}
                                                    className="relative group/doorman flex items-center gap-3 p-2 rounded-xl bg-background shadow-xl border border-border cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105"
                                                    onClick={() => setSelectedDoorman(doorman)}
                                                    style={{ animationDelay: `${index * 100}ms` }}
                                                >
                                                    {/* Tooltip */}
                                                    <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 opacity-0 group-hover/doorman:opacity-100 transition-all duration-300 pointer-events-none">
                                                        <div className="bg-foreground text-background px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-xl">
                                                            <div className="font-semibold">{doorman.name}</div>
                                                            <div className="text-xs opacity-80 capitalize">{doorman.shift} shift</div>
                                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[1px] w-2 h-2 bg-foreground rotate-45" />
                                                        </div>
                                                    </div>

                                                    <img
                                                        src={doorman.photo ? `/storage/${doorman.photo}` : '/placeholder-user.jpg'}
                                                        alt={doorman.name}
                                                        className="w-10 h-10 rounded-full object-cover border-2 border-primary/30"
                                                    />
                                                    <div className="w-2 h-2 rounded-full bg-accent absolute -bottom-1 -right-1 border-2 border-background"></div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center justify-between text-sm">
                                {building.apartments && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <div className="w-2 h-2 rounded-full bg-secondary"></div>
                                        <span>{building.apartments.length} apartments</span>
                                    </div>
                                )}
                                <div className="text-xs text-muted-foreground">
                                    {new Date(building.created_at).toLocaleDateString()}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                {/* Admin Button */}
                                <Link
                                    href={route('buildings.apartments', building)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg group/admin"
                                >
                                    <span>Admin</span>
                                    <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover/admin:translate-x-0.5" />
                                </Link>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    {building.status ? (
                                        <>
                                            <Button
                                                onClick={() => onEdit(building)}
                                                variant="secondary"
                                                size="icon"
                                                className="rounded-xl hover:scale-105 transition-all duration-300 hover:shadow-md"
                                                title="Edit Building"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                onClick={() => onToggleStatus(building)}
                                                size="icon"
                                                className="rounded-xl bg-secondary hover:bg-secondary/90 hover:scale-105 transition-all duration-300 hover:shadow-md"
                                                title="Archive Building"
                                            >
                                                <Archive className="w-4 h-4" />
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                onClick={() => onToggleStatus(building)}
                                                size="icon"
                                                className="rounded-xl bg-secondary hover:bg-secondary/90 hover:scale-105 transition-all duration-300 hover:shadow-md"
                                                title="Restore Building"
                                            >
                                                <ArchiveRestore className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                onClick={() => onDelete(building)}
                                                variant="destructive"
                                                size="icon"
                                                className="rounded-xl hover:scale-105 transition-all duration-300 hover:shadow-md"
                                                title="Delete Building"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Hover Effect Border */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                        {/* Enhanced Doorman Modal with Advanced Animations */}
                        {selectedDoorman && (
                            <div 
                                className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"
                                onClick={(e) => {
                                    if (e.target === e.currentTarget) setSelectedDoorman(null);
                                }}
                            >
                                <div className="bg-background/95 dark:bg-background/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-border/50 dark:border-border/30 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                                    {/* Close Button - Outside */}
                                    <button
                                        onClick={() => setSelectedDoorman(null)}
                                        className="absolute -top-2 -right-2 z-10 w-10 h-10 rounded-full bg-background dark:bg-background shadow-lg border border-border/50 dark:border-border/30 flex items-center justify-center hover:scale-110 transition-all duration-200 group"
                                    >
                                        <X className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                                    </button>

                                    {/* Header with enhanced gradient and dark mode support */}
                                    <div className="relative p-8 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 dark:from-primary/20 dark:via-secondary/10 dark:to-accent/20">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10 dark:to-transparent"></div>
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)] dark:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent)]"></div>
                                        
                                        <div className="relative flex flex-col items-center">
                                            <div className="relative group">
                                                <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-accent/30 rounded-full blur-lg scale-110 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                                                <img
                                                    src={selectedDoorman.photo
                                                        ? `/storage/${selectedDoorman.photo}`
                                                        : '/placeholder-user.jpg'}
                                                    alt={selectedDoorman.name}
                                                    className="relative w-28 h-28 rounded-full object-cover border-4 border-primary/30 dark:border-primary/50 shadow-xl transition-transform duration-300 group-hover:scale-105"
                                                />
                                                {/* Status indicator with pulse animation */}
                                                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-accent rounded-full border-4 border-background dark:border-background flex items-center justify-center shadow-lg">
                                                    <div className="w-3 h-3 bg-background dark:bg-background rounded-full animate-pulse"></div>
                                                    <div className="absolute inset-0 bg-accent rounded-full animate-ping opacity-75"></div>
                                                </div>
                                            </div>
                                            
                                            <h4 className="text-2xl font-bold text-foreground dark:text-foreground mt-6 animate-in slide-in-from-bottom-2 duration-500 delay-100">
                                                {selectedDoorman.name}
                                            </h4>
                                            
                                            <div className="px-4 py-2 bg-primary/20 dark:bg-primary/30 text-primary dark:text-primary rounded-full text-sm font-semibold mt-3 capitalize backdrop-blur-sm border border-primary/20 dark:border-primary/40 animate-in slide-in-from-bottom-2 duration-500 delay-200">
                                                {selectedDoorman.shift === 'morning' ? '🌅 Morning' :
                                                selectedDoorman.shift === 'afternoon' ? '☀️ Afternoon' : '🌙 Night'} Shift
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content with improved spacing and dark mode */}
                                    <div className="p-8 space-y-6">
                                        <div className="space-y-4">
                                            {/* Email Card */}
                                            <div className="group flex items-center gap-4 p-4 rounded-2xl bg-muted/30 dark:bg-muted/20 border border-border/20 dark:border-border/10 hover:bg-muted/50 dark:hover:bg-muted/30 transition-all duration-300 animate-in slide-in-from-left duration-500 delay-300">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/20 dark:bg-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                    <svg className="w-5 h-5 text-primary dark:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">Email</div>
                                                    <div className="text-sm font-semibold text-foreground dark:text-foreground mt-1 truncate">{selectedDoorman.email || 'Not provided'}</div>
                                                </div>
                                            </div>
                                            
                                            {/* Phone Card */}
                                            <div className="group flex items-center gap-4 p-4 rounded-2xl bg-muted/30 dark:bg-muted/20 border border-border/20 dark:border-border/10 hover:bg-muted/50 dark:hover:bg-muted/30 transition-all duration-300 animate-in slide-in-from-right duration-500 delay-400">
                                                <div className="w-12 h-12 rounded-2xl bg-secondary/20 dark:bg-secondary/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                    <svg className="w-5 h-5 text-secondary dark:text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">Phone</div>
                                                    <div className="text-sm font-semibold text-foreground dark:text-foreground mt-1 truncate">{selectedDoorman.phone || 'Not provided'}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Enhanced Close Button */}
                                        <Button
                                            onClick={() => setSelectedDoorman(null)}
                                            className="w-full mt-8 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary dark:from-primary dark:to-primary/90 text-primary-foreground rounded-2xl py-4 font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg shadow-primary/25 dark:shadow-primary/20 animate-in slide-in-from-bottom duration-500 delay-500"
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                Close
                                                <Check className="w-4 h-4" />
                                            </span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    // Enhanced Empty State
    const EmptyState = ({ onAddNew }: { onAddNew: () => void }) => (
        <div className="relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]"></div>
            
            <div className="relative bg-gradient-to-br from-background via-muted/10 to-background p-12 rounded-2xl text-center border-2 border-dashed border-primary/30 backdrop-blur-sm">
                {/* Icon with animation */}
                <div className="relative mb-6 flex justify-center">
                    <div className="relative p-6 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
                        <IconBuilding className="w-16 h-16 text-primary" />
                        {/* Floating particles */}
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse"></div>
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-secondary rounded-full animate-pulse delay-300"></div>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-4 mb-8">
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        No Buildings Yet
                    </h3>
                    <p className="text-lg text-muted-foreground max-w-md mx-auto">
                        Create your first building to start managing apartments, tenants, and doormen
                    </p>
                </div>

                {/* Action Button */}
                <button
                    onClick={onAddNew}
                    className="group inline-flex items-center gap-3 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                    <Plus className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
                    Create First Building
                </button>

                {/* Decorative elements */}
                <div className="absolute top-8 left-8 w-16 h-16 border-2 border-primary/20 rounded-full"></div>
                <div className="absolute bottom-8 right-8 w-12 h-12 border-2 border-secondary/20 rounded-full"></div>
                <div className="absolute top-1/2 left-4 w-2 h-8 bg-gradient-to-b from-accent/30 to-transparent rounded-full"></div>
                <div className="absolute top-1/3 right-4 w-2 h-12 bg-gradient-to-b from-primary/30 to-transparent rounded-full"></div>
            </div>
        </div>
    );

    // Paginación personalizada
    const Pagination = ({ links, meta }: { links: PaginationLink[], meta: PaginationMeta }) => (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="text-sm text-muted-foreground">
                Showing {meta.per_page * (meta.current_page - 1) + 1} -{' '}
                {Math.min(meta.per_page * meta.current_page, meta.total)} of {meta.total}
            </div>
            <div className="flex gap-1">
                {links.map((link, index) => (
                    link.url && (
                        <Link
                            key={index}
                            href={link.url}
                            className={`px-3 py-1 rounded-lg ${link.active
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    )
                ))}
            </div>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buildings" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-gray-100 dark:!bg-transparent p-1 rounded flex">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow dark:bg-card' : ''}`}
                            >
                                <LayoutGrid className={`w-5 h-5 ${viewMode === 'grid' ? 'text-primary' : 'text-gray-600'}`} />
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-2 rounded ${viewMode === 'table' ? 'bg-white shadow dark:bg-card' : ''}`}
                            >
                                <TableIcon className={`w-5 h-5 ${viewMode === 'table' ? 'text-primary' : 'text-gray-600'}`} />
                            </button>
                        </div>
                        {viewMode === 'grid' && (
                            <select
                                value={gridColumns}
                                onChange={(e) => setGridColumns(Number(e.target.value))}
                                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            >
                                {[2, 3, 4, 5, 6].map(num => (
                                    <option key={num} value={num}>{num} Cards</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            onClick={() => {
                                reset();
                                setCurrentBuilding(null);
                                setShowCreateModal(true);
                            }}
                            className="flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:block">New Building</span>
                        </Button>
                    </div>
                </div>

                {/* Filtros y controles de tabla */}
                {viewMode === 'table' && (
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Search across all columns..."
                                    value={globalFilter ?? ""}
                                    onChange={(event) => setGlobalFilter(event.target.value)}
                                    className="pl-10 w-64"
                                />
                            </div>
                            <div className="hidden sm:block text-sm text-muted-foreground">
                                {table.getFilteredRowModel().rows.length} of {table.getCoreRowModel().rows.length} entries
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className='group hover:text-white'>
                                        <Filter className="mr-2 h-4 w-4 dark:group-hover:text-white" />
                                        Columns <ChevronDown className="ml-1 h-4 w-4 dark:group-hover:text-white" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    {table
                                        .getAllColumns()
                                        .filter((column) => column.getCanHide())
                                        .map((column) => (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                className="capitalize"
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) =>
                                                    column.toggleVisibility(!!value)
                                                }
                                            >
                                                {column.id.replace(/_/g, ' ')}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className='group hover:text-white'>
                                        <FileSpreadsheet className="mr-2 h-4 w-4 dark:group-hover:text-white" />
                                        Export <ChevronDown className="ml-1 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={exportToCSV} className='group'>
                                        <Download className="mr-2 h-4 w-4 group-hover:text-white dark:group-hover:text-primary-foreground" />
                                        Export to CSV
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={exportToExcel} className='group '>
                                        <Download className="mr-2 h-4 w-4 group-hover:text-white dark:group-hover:text-primary-foreground" />
                                        Export to Excel
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                )}

                {/* Content Section */}
                {buildings.data.length === 0 ? (
                    <EmptyState onAddNew={() => setShowCreateModal(true)} />
                ) : viewMode === 'grid' ? (
                    <GridView
                        buildings={buildings.data}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleStatus={toggleStatus}
                        isUpdatingStatus={isUpdatingStatus}
                        onShowLocation={showLocation}
                        gridColumns={gridColumns}
                    />
                ) : (
                    <>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => (
                                                <TableHead key={header.id}>
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows?.length ? (
                                        table.getRowModel().rows.map((row) => (
                                            <TableRow
                                                key={row.id}
                                                data-state={row.getIsSelected() && "selected"}
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={columns.length}
                                                className="h-24 text-center"
                                            >
                                                No results.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Enhanced Pagination */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-muted/20">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>
                                    Showing {((buildings.meta.current_page - 1) * buildings.meta.per_page) + 1} to{' '}
                                    {Math.min(buildings.meta.current_page * buildings.meta.per_page, buildings.meta.total)}{' '}
                                    of {buildings.meta.total} entries
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/*  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                                    <select
                                        value={buildings.meta.per_page}
                                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                        className="border rounded px-2 py-1 text-sm bg-background"
                                    >
                                        {[10, 20, 30, 40, 50].map(pageSize => (
                                            <option key={pageSize} value={pageSize}>
                                                {pageSize}
                                            </option>
                                        ))}
                                    </select>
                                </div> */}

                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(1)}
                                        disabled={buildings.meta.current_page === 1}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        <ChevronLeft className="h-4 w-4 -ml-2" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(buildings.meta.current_page - 1)}
                                        disabled={buildings.meta.current_page === 1}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm text-muted-foreground">Page</span>
                                        <input
                                            type="number"
                                            value={buildings.meta.current_page}
                                            onChange={(e) => {
                                                const page = e.target.value ? Number(e.target.value) : 1;
                                                if (page >= 1 && page <= buildings.meta.last_page) {
                                                    handlePageChange(page);
                                                }
                                            }}
                                            className="w-12 h-8 text-center border rounded text-sm bg-background"
                                            min="1"
                                            max={buildings.meta.last_page}
                                        />
                                        <span className="text-sm text-muted-foreground">of {buildings.meta.last_page}</span>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(buildings.meta.current_page + 1)}
                                        disabled={buildings.meta.current_page === buildings.meta.last_page}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(buildings.meta.last_page)}
                                        disabled={buildings.meta.current_page === buildings.meta.last_page}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                        <ChevronRight className="h-4 w-4 -ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Create/Edit Building Modal */}
                <Dialog 
                    open={showCreateModal} 
                    onOpenChange={(open) => {
                        if (!open) {
                            handleCloseModal();
                        } else {
                            setShowCreateModal(true);
                        }
                    }}
                >
                    <DialogContent className="w-full max-w-none sm:max-w-4xl mx-0 sm:mx-4 p-0 overflow-hidden bg-background dark:bg-background">
                        {/* Enhanced scrollable container */}
                        <div 
                            className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800 px-6 py-8" 
                            style={{ 
                                maxHeight: '90vh',
                                scrollbarWidth: 'thin',
                                scrollbarColor: 'rgb(156 163 175) rgb(243 244 246)'
                            }}
                        >
                            <DialogHeader className="mb-8">
                                <DialogTitle className="text-3xl font-semibold tracking-tight text-foreground dark:text-foreground">
                                    {currentBuilding ? 'Edit Building' : 'New Building'}
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground dark:text-muted-foreground">
                                    {currentBuilding ? 'Update the building information below.' : 'Fill in the building information below to create a new record.'}
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={currentBuilding ? handleUpdateSubmit : handleCreateSubmit} className="space-y-8">
                                <Tabs defaultValue="building" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="building">Building</TabsTrigger>
                                        <TabsTrigger value="owner">Owner</TabsTrigger>
                                        <TabsTrigger value="doorman">Doorman</TabsTrigger>
                                    </TabsList>

                                    {/* Building Tab */}
                                    <TabsContent value="building">
                                        <div className="grid grid-cols-12 gap-6 p-4">
                                            <div className="col-span-12 md:col-span-5 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="image" className="text-base">
                                                        Building Photo
                                                    </Label>
                                                    {!currentBuilding && <span className="text-[0.8rem] text-muted-foreground">Required *</span>}
                                                </div>

                                                <div className={`group relative w-full aspect-[4/3] rounded-lg overflow-hidden transition-all duration-300 
                            ${errors.image ? 'ring-2 ring-destructive' : 'hover:ring-2 hover:ring-ring'} 
                            bg-muted/50`}>
                                                    <input
                                                        id="building-image-upload"
                                                        type="file"
                                                        accept="image/png, image/jpeg, image/jpg"
                                                        onChange={(e) => setData('image', e.target.files?.[0] || null)}
                                                        className="hidden"
                                                    />
                                                    <label htmlFor="building-image-upload" className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                                                        {data.image || currentBuilding?.image ? (
                                                            <div className="relative w-full h-full group">
                                                                <img
                                                                    src={data.image
                                                                        ? URL.createObjectURL(data.image)
                                                                        : `/storage/${currentBuilding?.image}`}
                                                                    alt="Building preview"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2">
                                                                    <UploadCloud className="w-8 h-8 text-white" />
                                                                    <p className="text-sm text-white font-medium">Click to change photo</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center p-4 text-center h-full">
                                                                <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-3">
                                                                    <UploadCloud className="w-6 h-6 text-muted-foreground" />
                                                                </div>
                                                                <p className="text-sm font-medium text-muted-foreground mb-1">Drag & drop or click to upload</p>
                                                                <p className="text-xs text-muted-foreground">PNG, JPG or JPEG (max. 2MB)</p>
                                                            </div>
                                                        )}
                                                    </label>
                                                </div>
                                                {errors.image && <p className="text-sm text-destructive">{errors.image}</p>}
                                            </div>

                                            <div className="col-span-12 md:col-span-7 space-y-6">
                                                <div className="grid gap-6">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <Label htmlFor="name" className="text-base">
                                                                Building Name
                                                            </Label>
                                                            <span className="text-[0.8rem] text-muted-foreground">Required *</span>
                                                        </div>
                                                        <Input
                                                            id="name"
                                                            value={data.name}
                                                            onChange={(e) => setFormData('name', e.target.value)}
                                                            className={`h-11 ${errors.name ? 'ring-2 ring-destructive' : ''}`}
                                                            placeholder="Enter building name"
                                                            required
                                                        />
                                                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                                    </div>

                                                    <div className="space-y-4">
                                                        <Label htmlFor="description" className="text-base">
                                                            Description
                                                        </Label>
                                                        <Textarea
                                                            id="description"
                                                            value={data.description}
                                                            onChange={(e) => setFormData('description', e.target.value)}
                                                            rows={4}
                                                            className="resize-none"
                                                            placeholder="Enter building description..."
                                                        />
                                                    </div>

                                                    <div className="space-y-4">
                                                        <Label htmlFor="location_link" className="text-base">
                                                            Location (Latitude, Longitude)
                                                        </Label>
                                                        <Input
                                                            id="location_link"
                                                            value={data.location_link}
                                                            onChange={(e) => setFormData('location_link', e.target.value)}
                                                            type="text"
                                                            placeholder="40.77419417199397, -73.96557928650753"
                                                            className="h-11"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* Owner Tab */}
                                    <TabsContent value="owner">
                                        <div className="grid grid-cols-12 gap-6 p-4">
                                            <div className="col-span-12 md:col-span-5 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="owner-photo" className="text-base">
                                                        Owner Photo
                                                    </Label>
                                                    {!currentBuilding && <span className="text-[0.8rem] text-muted-foreground">Required *</span>}
                                                </div>

                                                <div className={`group relative w-full aspect-[4/3] rounded-lg overflow-hidden transition-all duration-300 
                            ${errors['owner.photo'] ? 'ring-2 ring-destructive' : 'hover:ring-2 hover:ring-ring'} 
                            bg-muted/50`}>
                                                    <input
                                                        id="owner-photo-upload"
                                                        type="file"
                                                        accept="image/png, image/jpeg, image/jpg"
                                                        onChange={(e) => setData('owner', {
                                                            ...data.owner,
                                                            photo: e.target.files?.[0] || null
                                                        })}
                                                        className="hidden"
                                                    />
                                                    <label htmlFor="owner-photo-upload" className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                                                        {data.owner.photo || currentBuilding?.owner.photo ? (
                                                            <div className="relative w-full h-full group">
                                                                <img
                                                                    src={data.owner.photo
                                                                        ? URL.createObjectURL(data.owner.photo)
                                                                        : `/storage/${currentBuilding?.owner.photo}`}
                                                                    alt="Owner preview"
                                                                    className="w-full h-full object-cover"
                                                                />
                                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2">
                                                                    <UploadCloud className="w-8 h-8 text-white" />
                                                                    <p className="text-sm text-white font-medium">Click to change photo</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center p-4 text-center h-full">
                                                                <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-3">
                                                                    <UploadCloud className="w-6 h-6 text-muted-foreground" />
                                                                </div>
                                                                <p className="text-sm font-medium text-muted-foreground mb-1">Drag & drop or click to upload</p>
                                                                <p className="text-xs text-muted-foreground">PNG, JPG or JPEG (max. 2MB)</p>
                                                            </div>
                                                        )}
                                                    </label>
                                                </div>
                                                {errors['owner.photo'] && <p className="text-sm text-destructive">{errors['owner.photo']}</p>}
                                            </div>

                                            <div className="col-span-12 md:col-span-7 space-y-6">
                                                <div className="grid gap-6">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <Label htmlFor="owner-name" className="text-base">
                                                                Owner Name
                                                            </Label>
                                                            <span className="text-[0.8rem] text-muted-foreground">Required *</span>
                                                        </div>
                                                        <Input
                                                            id="owner-name"
                                                            value={data.owner.name}
                                                            onChange={(e) => setData('owner', {
                                                                ...data.owner,
                                                                name: e.target.value
                                                            })}
                                                            className={`h-11 ${errors['owner.name'] ? 'ring-2 ring-destructive' : ''}`}
                                                            placeholder="Enter owner name"
                                                            required
                                                        />
                                                        {errors['owner.name'] && <p className="text-sm text-destructive">{errors['owner.name']}</p>}
                                                    </div>

                                                    <div className="space-y-4">
                                                        <Label htmlFor="owner-email" className="text-base">
                                                            Email
                                                        </Label>
                                                        <Input
                                                            id="owner-email"
                                                            value={data.owner.email}
                                                            onChange={(e) => setData('owner', {
                                                                ...data.owner,
                                                                email: e.target.value
                                                            })}
                                                            type="email"
                                                            className={`h-11 ${errors['owner.email'] ? 'ring-2 ring-destructive' : ''}`}
                                                            placeholder="owner@example.com"
                                                            required
                                                        />
                                                        {errors['owner.email'] && <p className="text-sm text-destructive">{errors['owner.email']}</p>}
                                                    </div>

                                                    <div className="space-y-4">
                                                        <Label htmlFor="owner-phone" className="text-base">
                                                            Phone Number
                                                        </Label>
                                                        <Input
                                                            id="owner-phone"
                                                            value={data.owner.phone}
                                                            onChange={(e) => setData('owner', {
                                                                ...data.owner,
                                                                phone: e.target.value
                                                            })}
                                                            placeholder="+1 (555) 000-0000"
                                                            className="h-11"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* Doorman Tab */}

                                    <TabsContent value="doorman" className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h3 className="text-lg font-semibold">Doormen Management</h3>

                                                </div>
                                                <Button
                                                    type="button"
                                                    onClick={() => {
                                                        setData('doormen', [...data.doormen, {
                                                            name: '',
                                                            photo: null,
                                                            email: '',
                                                            phone: '',
                                                            shift: 'morning',
                                                        }]);
                                                    }}
                                                    //disabled={data.doormen.length >= 5}
                                                    variant="default"
                                                    className="gap-2"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Add Doorman
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {data.doormen.map((doorman, index) => (
                                                    <div key={index} className="bg-card border rounded-lg p-4 space-y-4 shadow-sm relative">
                                                        <div className="absolute top-2 right-2 z-[9999]">
                                                            <Button
                                                                variant="destructive"
                                                                size="icon"
                                                                className="w-8 h-8"
                                                                onClick={() => {
                                                                    const newDoormen = [...data.doormen];
                                                                    newDoormen.splice(index, 1);
                                                                    setData('doormen', newDoormen);
                                                                }}
                                                            >
                                                                <Trash2 className="w-4 h-4 " />
                                                            </Button>
                                                        </div>

                                                        {/* Photo Upload */}
                                                        <div className="space-y-2">

                                                            <div className={`group relative aspect-square w-full rounded-lg border-2 border-dashed ${errors[`doormen.${index}.photo`] ? 'border-destructive' : 'border-muted'
                                                                } transition-colors hover:border-primary`}>
                                                                <input
                                                                    id={`doorman-photo-${index}`}
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={(e) => {
                                                                        const newDoormen = [...data.doormen];
                                                                        newDoormen[index].photo = e.target.files?.[0] || null;
                                                                        setData('doormen', newDoormen);
                                                                    }}
                                                                    className="hidden"
                                                                />
                                                                <label
                                                                    htmlFor={`doorman-photo-${index}`}
                                                                    className="flex flex-col items-center justify-center h-full w-full cursor-pointer p-4"
                                                                >
                                                                    {doorman.photo || currentBuilding?.doormen[index]?.photo ? (
                                                                        <img
                                                                            src={doorman.photo
                                                                                ? URL.createObjectURL(doorman.photo)
                                                                                : `/storage/${currentBuilding?.doormen[index]?.photo}`}
                                                                            alt="Preview"
                                                                            className="w-full h-full object-cover rounded-md"
                                                                        />
                                                                    ) : (
                                                                        <div className="text-center space-y-2">
                                                                            <UploadCloud className="w-8 h-8 mx-auto text-muted-foreground" />
                                                                            <p className="text-sm text-muted-foreground">Click to upload</p>
                                                                            <p className="text-xs text-muted-foreground">Recommended: 400x400px</p>
                                                                        </div>
                                                                    )}
                                                                </label>
                                                            </div>
                                                            {errors[`doormen.${index}.photo`] && (
                                                                <p className="text-xs text-destructive">{errors[`doormen.${index}.photo`]}</p>
                                                            )}
                                                        </div>

                                                        {/* Form Fields */}
                                                        <div className="space-y-2">
                                                            <Input
                                                                placeholder="Full Name"
                                                                value={doorman.name}
                                                                onChange={(e) => {
                                                                    const newDoormen = [...data.doormen];
                                                                    newDoormen[index].name = e.target.value;
                                                                    setData('doormen', newDoormen);
                                                                }}
                                                                className="h-11"
                                                            />
                                                            <Input
                                                                type="email"
                                                                placeholder="Email address"
                                                                value={doorman.email}
                                                                onChange={(e) => {
                                                                    const newDoormen = [...data.doormen];
                                                                    newDoormen[index].email = e.target.value;
                                                                    setData('doormen', newDoormen);
                                                                }}
                                                                className="h-11"
                                                            />
                                                            <Input
                                                                placeholder="Phone number"
                                                                value={doorman.phone}
                                                                onChange={(e) => {
                                                                    const newDoormen = [...data.doormen];
                                                                    newDoormen[index].phone = e.target.value;
                                                                    setData('doormen', newDoormen);
                                                                }}
                                                                className="h-11"
                                                            />
                                                            <div className="space-y-2">

                                                                <Select
                                                                    value={doorman.shift}
                                                                    onValueChange={(value) => {
                                                                        const newDoormen = [...data.doormen];
                                                                        newDoormen[index].shift = value as 'morning' | 'afternoon' | 'night';
                                                                        setData('doormen', newDoormen);
                                                                    }}

                                                                >
                                                                    <SelectTrigger className="w-full h-11">
                                                                        <SelectValue placeholder="Select work shift" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="morning">Morning</SelectItem>
                                                                        <SelectItem value="afternoon">Afternoon</SelectItem>
                                                                        <SelectItem value="night">Night</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </TabsContent>

                                </Tabs>

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-4 pt-6">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-11 dark:hover:text-white"
                                        onClick={handleCloseModal}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="h-11"
                                    >
                                        {processing
                                            ? (currentBuilding ? 'Updating...' : 'Creating...')
                                            : (currentBuilding ? 'Update Building' : 'Create Building')}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Confirmation Modal for Unsaved Changes */}
                <Dialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
                    <DialogContent className="sm:max-w-md bg-background dark:bg-background">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-foreground dark:text-foreground">
                                <AlertCircle className="w-5 h-5 text-amber-500" />
                                Unsaved Changes
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground dark:text-muted-foreground">
                                You have unsaved changes that will be lost if you continue. Are you sure you want to close without saving?
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setShowConfirmClose(false)}
                                className="h-10 dark:hover:text-white"
                            >
                                Keep Editing
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={confirmDiscardChanges}
                                className="h-10"
                            >
                                Discard Changes
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal */}
                <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Deletion</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete the building <strong>{currentBuilding?.name}</strong>?
                                This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowDeleteModal(false)}
                                className='dark:hover:text-white'
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={confirmDelete}
                            >
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Location Modal */}
                <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
                    <DialogContent className="sm:max-w-[800px]">
                        <DialogHeader>
                            <DialogTitle>Location of {currentBuilding?.name}</DialogTitle>
                        </DialogHeader>
                        <div className="w-full aspect-video">
                            <iframe
                                src={getEmbedUrl(currentBuilding?.location_link || '')}
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Pagination para vista de cuadrícula */}
                {viewMode === 'grid' && buildings.data.length > 0 && (
                    <Pagination links={buildings.links} meta={buildings.meta} />
                )}
            </div>
        </AppLayout>
    );
}

// Componente StatusBadge
const StatusBadge = ({ status }: { status: string }) => (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
        {status === 'active' ? 'Active' : 'Inactive'}
    </span>
);

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Buildings', href: '/buildings' }
];