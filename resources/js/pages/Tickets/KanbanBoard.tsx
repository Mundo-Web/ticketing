import React, { useState, useEffect, Fragment, useCallback, useMemo } from "react";
import { Share2, MessageSquare, CalendarIcon, Clock, AlertCircle, CheckCircle, XCircle, Filter, Search, MoreVertical, Tag, Monitor, User, Building, Home, Trash2 } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { router } from "@inertiajs/react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@radix-ui/react-tooltip";
import DeviceIcon from '@/components/DeviceIcon';

// Componente MemberCard para mostrar información del member
const MemberCard = ({ ticket }: { ticket: any }) => {
    if (!ticket.user || !ticket.user.tenant) return null;

    const tenant = ticket.user.tenant;

    return (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                    {tenant.photo ? (
                        <img
                            src={tenant.photo.startsWith('http')
                                ? tenant.photo
                                : `/storage/${tenant.photo}`}
                            alt={tenant.name}
                            className="w-10 h-10 rounded-full border-2 border-purple-300 shadow-md object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-sm font-bold">
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
                            {tenant.apartment.building.image ? (
                                <img
                                    src={`/storage/${tenant.apartment.building.image}`}
                                    alt={tenant.apartment.building.name}
                                    className="w-3 h-3 rounded-full object-cover border border-gray-300"
                                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                        e.currentTarget.style.display = 'none';
                                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                        if (nextElement) {
                                            nextElement.style.display = 'inline-block';
                                        }
                                    }}
                                />
                            ) : null}
                            <Building className={`w-3 h-3 text-gray-600 ${tenant.apartment.building.image ? 'hidden' : ''}`} />
                            <p className="text-xs text-gray-700 truncate">
                                {tenant.apartment.building.name}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const getStatuses = (props: any) => {
    const { isTechnicalDefault, isTechnical, isSuperAdmin, isMember, statusFilter } = props;

    // Si hay un filtro de estado específico, mostrar SOLO las columnas de ese filtro
    if (statusFilter) {
        const statuses = statusFilter.split(',');
        const filteredColumns = [];

        for (const status of statuses) {
            switch (status.trim()) {
                case 'open':
                    filteredColumns.push({ key: "open", label: "OPEN", icon: AlertCircle, color: "bg-amber-600" });
                    break;
                case 'in_progress':
                    filteredColumns.push({ key: "in_progress", label: "IN PROGRESS", icon: Clock, color: "bg-blue-600" });
                    break;
                case 'resolved':
                    filteredColumns.push({ key: "resolved", label: "RESOLVED", icon: CheckCircle, color: "bg-emerald-600" });
                    break;
                case 'closed':
                    filteredColumns.push({ key: "closed", label: "CLOSED", icon: XCircle, color: "bg-slate-600" });
                    break;
                case 'cancelled':
                    filteredColumns.push({ key: "cancelled", label: "CANCELLED", icon: XCircle, color: "bg-red-600" });
                    break;
                case 'reopened':
                    filteredColumns.push({ key: "reopened", label: "REOPENED", icon: AlertCircle, color: "bg-purple-600" });
                    break;
            }
        }

        return filteredColumns;
    }

    // Sin filtro: mostrar columnas normales según el rol
    if (isTechnicalDefault) {
        return [
            { key: "recents", label: "TO DO", icon: AlertCircle, color: "bg-amber-600" },
            { key: "in_progress", label: "IN PROGRESS", icon: Clock, color: "bg-blue-600" },
            { key: "resolved", label: "RESOLVED", icon: CheckCircle, color: "bg-emerald-600" },
            { key: "reopened", label: "REOPENED", icon: AlertCircle, color: "bg-purple-600" },
        ];
    }

    if (isTechnical) {
        return [
            { key: "recents", label: "TO DO", icon: AlertCircle, color: "bg-amber-600" },
            { key: "in_progress", label: "IN PROGRESS", icon: Clock, color: "bg-blue-600" },
            { key: "resolved", label: "RESOLVED", icon: CheckCircle, color: "bg-emerald-600" },
            { key: "reopened", label: "REOPENED", icon: AlertCircle, color: "bg-purple-600" },
        ];
    }

    return [
        { key: "open", label: "TO DO", icon: AlertCircle, color: "bg-amber-600" },
        { key: "in_progress", label: "IN PROGRESS", icon: Clock, color: "bg-blue-600" },
        { key: "resolved", label: "RESOLVED", icon: CheckCircle, color: "bg-emerald-600" },
        { key: "reopened", label: "REOPENED", icon: AlertCircle, color: "bg-purple-600" },
        { key: "closed", label: "CLOSED", icon: XCircle, color: "bg-slate-600" },
        { key: "cancelled", label: "CANCELLED", icon: XCircle, color: "bg-red-600" },
    ];
};

export default function KanbanBoard(props: any) {
    const [menuOpen, setMenuOpen] = useState<number | null>(null);
    const {
        tickets,
        user,
        onTicketClick,
        isTechnicalDefault,
        isTechnical,
        isSuperAdmin,
        isMember,
        onStatusChange,
        onStatusChangeWithComment,
        statusFilter
    } = props;
    const isManager = isTechnicalDefault || isSuperAdmin;
    const [showRecents, setShowRecents] = useState(isManager);
    const [searchQuery, setSearchQuery] = useState("");
    const [technicals, setTechnicals] = useState<any[]>([]);
    const [selectedTechnicalIds, setSelectedTechnicalIds] = useState<number[]>([]);
    const [buildings, setBuildings] = useState<any[]>([]);
    const [selectedBuildingIds, setSelectedBuildingIds] = useState<number[]>([]);
    const [showFilters, setShowFilters] = useState(false); useEffect(() => {
        // Cargar técnicos siempre, no solo para jefe técnico
        fetch('/api/technicals')
            .then(res => res.json())
            .then(data => {
                console.log("Técnicos cargados en KanbanBoard:", data.technicals);
                setTechnicals(data.technicals || []);
            })
            .catch(error => {
                console.error("Error al cargar técnicos en KanbanBoard:", error);
            });

        // Cargar edificios
        fetch('/api/buildings')
            .then(res => res.json())
            .then(data => {
                console.log("Edificios cargados en KanbanBoard:", data.buildings);
                console.log("Primer edificio:", data.buildings?.[0]);
                setBuildings(data.buildings || []);
            })
            .catch(error => {
                console.error("Error al cargar edificios en KanbanBoard:", error);
            });
    }, []);

    // Memoizamos filteredTickets para evitar recálculos innecesarios
    const filteredTickets = useMemo(() => {
        return tickets.filter((t: any) => {
            // Filtro por técnicos (solo se aplica si es manager y ha seleccionado técnicos)
            if (isManager && selectedTechnicalIds.length > 0 && !selectedTechnicalIds.includes(t.technical_id)) {
                return false;
            }

            // Filtro por edificios (solo se aplica si es manager y ha seleccionado edificios)
            if (isManager && selectedBuildingIds.length > 0 && !selectedBuildingIds.includes(t.user?.tenant?.apartment?.building?.id)) {
                return false;
            }

            // Filtro por búsqueda
            if (searchQuery) {
                const search = searchQuery.toLowerCase();
                return t.id.toString().includes(search) ||
                    t.title.toLowerCase().includes(search) ||
                    t.description?.toLowerCase().includes(search) ||
                    t.category?.toLowerCase().includes(search) ||
                    `${t.code}`.includes(search);
            }

            return true;
        });
    }, [tickets, isManager, selectedTechnicalIds, selectedBuildingIds, searchQuery]);

    // Funciones helper para manejar selección múltiple
    const toggleTechnicalSelection = (technicalId: number) => {
        setSelectedTechnicalIds(prev =>
            prev.includes(technicalId)
                ? prev.filter(id => id !== technicalId)
                : [...prev, technicalId]
        );
    };

    const toggleBuildingSelection = (buildingId: number) => {
        setSelectedBuildingIds(prev =>
            prev.includes(buildingId)
                ? prev.filter(id => id !== buildingId)
                : [...prev, buildingId]
        );
    };

    const clearTechnicalFilters = () => {
        setSelectedTechnicalIds([]);
    };

    const clearBuildingFilters = () => {
        setSelectedBuildingIds([]);
    };    // Memoizamos los estados para evitar recálculos innecesarios
    const statuses = useMemo(() => {
        return getStatuses({ isTechnicalDefault: isManager, isTechnical, isSuperAdmin, isMember, statusFilter });
    }, [isManager, isTechnical, isSuperAdmin, isMember, statusFilter]);

    // Usamos useCallback para memoizar la función groupTickets
    const groupTickets = useCallback(() => {
        return statuses.reduce((acc: any, status) => {
            if (status.key === "recents") {
                acc[status.key] = filteredTickets.filter((t: any) => t.status === "open");
            } else {
                acc[status.key] = filteredTickets.filter((t: any) => t.status === status.key);
            }
            return acc;
        }, {});
    }, [statuses, filteredTickets]);    // Memoizamos el resultado actual de groupTickets para no recalcularlo en cada render
    const currentColumns = useMemo(() => {
        return groupTickets();
    }, [groupTickets]);

    // Definimos un tipo para las columnas para evitar errores de TypeScript
    type ColumnsType = {
        [key: string]: any[];
    };

    const [columns, setColumns] = useState<ColumnsType>(currentColumns);    // Actualizamos las columnas solo cuando cambian los datos memoizados de las columnas
    useEffect(() => {
        // Evitamos actualizaciones innecesarias comparando los valores
        const newColumns = currentColumns;
        const currentKeys = Object.keys(columns);
        const newKeys = Object.keys(newColumns);

        // Solo actualizamos si realmente hay cambios
        if (currentKeys.length !== newKeys.length ||
            !currentKeys.every(key =>
                columns[key]?.length === newColumns[key]?.length &&
                columns[key]?.every((item, index) => item.id === newColumns[key][index]?.id)
            )) {
            setColumns(newColumns);
        }
    }, [currentColumns]); const canDrag = isTechnical || isManager;    // Memoizamos la función onDragEnd para evitar recreaciones innecesarias
    const onDragEnd = useCallback((result: any) => {
        if (!canDrag) return;
        if (!result.destination) return;
        const { source, destination, draggableId } = result;
        if (source.droppableId === destination.droppableId) return;

        const ticket = columns[source.droppableId]?.find((t: any) => t.id === Number(draggableId));
        if (!ticket) return;

        const newStatus = destination.droppableId === "recents" ? "open" : destination.droppableId;

        // Estados que requieren comentario obligatorio
        const statusesRequiringComment = ['resolved', 'closed', 'cancelled'];

        if (statusesRequiringComment.includes(newStatus) && onStatusChangeWithComment) {
            // Usar la nueva función que abre el modal de comentario
            onStatusChangeWithComment(ticket, newStatus);
        } else {
            // Cambio directo para estados que no requieren comentario
            router.post(
                `/tickets/${ticket.id}/update-status`,
                { status: newStatus },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        if (onStatusChange) {
                            onStatusChange(ticket.id);
                        }
                    }
                }
            );
        }
    }, [canDrag, columns, onStatusChange, onStatusChangeWithComment]);

    return (
        <div className="flex flex-col h-full">
            {/* Modern Header */}
            <div className="bg-gradient-to-r from-background to-gray-50 border-b border-border py-4 px-6 mb-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">

                            <div>
                                <h1 className="text-xl font-bold text-foreground">Tickets Board</h1>

                            </div>
                            {/* Solo mostrar las secciones de filtros si es jefe técnico (isTechnicalDefault) */}
                            {isManager && (
                                <div className="flex w-auto justify-between gap-8">
                                    {/* Filtro por técnicos */}
                                    <div className="ml-6 flex gap-2 items-center justify-center h-full">
                                        <label className=" text-xs font-semibold text-gray-700  uppercase tracking-wider">
                                            Technicals
                                        </label>

                                        <div className="flex flex-wrap gap-2 items-center">
                                            {technicals.map(t => (
                                                <TooltipProvider key={t.id}>
                                                    <Tooltip delayDuration={300}>
                                                        <TooltipTrigger asChild>
                                                            <div
                                                                className={`cursor-pointer relative p-0.5 rounded-full transition-all duration-200 ${selectedTechnicalIds.includes(t.id)
                                                                    ? 'bg-blue-500 ring-2 ring-blue-300 scale-110'
                                                                    : 'hover:bg-gray-100'
                                                                    }`}
                                                                onClick={() => toggleTechnicalSelection(t.id)}
                                                            >
                                                                {t.photo ? (
                                                                    <img
                                                                        src={`/storage/${t.photo}`}
                                                                        alt={t.name}
                                                                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                                                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                                                            e.currentTarget.src = '/images/default-user.png';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-base font-bold">
                                                                        {t.name?.substring(0, 1) || '?'}
                                                                    </div>
                                                                )}

                                                                {selectedTechnicalIds.includes(t.id) && (
                                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-primary text-white px-3 py-1.5 text-xs rounded shadow-lg">
                                                            <p className="font-medium">{t.name}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            ))}

                                            {selectedTechnicalIds.length > 0 && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                onClick={clearTechnicalFilters}
                                                                className="ml-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-full font-medium shadow-sm border border-blue-200 transition-all duration-200"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                                                </svg>
                                                                Clear ({selectedTechnicalIds.length})
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-gray-800 text-white text-xs">
                                                            <p>Clear all technician filters</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    </div>

                                    {/* Filtro por edificios */}
                                    <div className="flex gap-2 items-center justify-center h-full">
                                        <label className=" text-xs font-semibold text-gray-700  uppercase tracking-wider">
                                            Buildings
                                        </label>
                                        <div className="flex flex-wrap gap-2 items-center">
                                            {buildings.map(b => (
                                                <TooltipProvider key={b.id}>
                                                    <Tooltip delayDuration={300}>
                                                        <TooltipTrigger asChild>
                                                            <div
                                                                className={`cursor-pointer relative p-0.5 rounded-full transition-all duration-200 ${selectedBuildingIds.includes(b.id)
                                                                    ? 'bg-green-500 ring-2 ring-green-300 scale-110'
                                                                    : 'hover:bg-gray-100'
                                                                    }`}
                                                                onClick={() => toggleBuildingSelection(b.id)}
                                                            >
                                                                {b.image ? (
                                                                    <img
                                                                        src={`/storage/${b.image}`}
                                                                        alt={b.name}
                                                                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                                                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                                                            e.currentTarget.src = '/images/default-builder-square.png';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center text-white text-base font-bold">
                                                                        <Building className="w-4 h-4" />
                                                                    </div>
                                                                )}

                                                                {selectedBuildingIds.includes(b.id) && (
                                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-primary text-white px-3 py-1.5 text-xs rounded shadow-lg">
                                                            <p className="font-medium">{b.name}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            ))}

                                            {selectedBuildingIds.length > 0 && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                onClick={clearBuildingFilters}
                                                                className="ml-2 flex items-center gap-1 text-xs text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-full font-medium shadow-sm border border-green-200 transition-all duration-200"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                                                </svg>
                                                                Clear ({selectedBuildingIds.length})
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-gray-800 text-white text-xs">
                                                            <p>Clear all building filters</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    </div>
                                </div>

                            )}

                        </div>
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search tickets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary bg-background w-64 shadow-sm transition-all duration-200 placeholder:text-muted-foreground"
                        />
                        <div className="absolute left-3 top-3 text-muted-foreground">
                            <Search size={16} />
                        </div>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <XCircle size={16} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="">
                        <div className="">
                            {/* <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                                    Técnico
                                </label>
                                <select
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                    value={selectedTechnicalId || ''}
                                    onChange={e => setSelectedTechnicalId(e.target.value ? Number(e.target.value) : null)}
                                >
                                    <option value="">Todos los técnicos</option>
                                    {technicals.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div> */}

                            {/*        <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                                    Estado
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {statuses.map(status => (
                                        <div 
                                            key={status.key} 
                                            className={`px-3 py-1 text-xs rounded-full font-medium flex items-center ${status.color} text-white`}
                                        >
                                            {status.label}
                                        </div>
                                    ))}
                                </div>
                            </div> */}




                        </div>
                    </div>


                </div>
            </div>

            {/* Kanban Board */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex flex-1 overflow-x-auto pb-4 px-2">
                    {statuses.map((status) => (
                        <Droppable droppableId={status.key} key={status.key} isDropDisabled={!canDrag}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="flex flex-col mr-4 min-w-[300px]"
                                >
                                    <div className={`flex items-center justify-between mb-3 px-3 py-2 rounded-t ${status.color} text-white`}>
                                        <div className="flex items-center">
                                            <status.icon className="w-4 h-4 mr-2" />
                                            <span className="font-semibold text-sm">{status.label}</span>
                                        </div>
                                        <span className={`bg-white text-black bg-opacity-30 w-5 h-5 flex items-center justify-center  rounded-full text-xs font-bold`}>
                                            {columns[status.key]?.length || 0}
                                        </span>
                                    </div>

                                    <div
                                        className={`flex-1 rounded-b rounded-tr bg-gray-100 p-3 ${snapshot.isDraggingOver ? "ring-2 ring-blue-300 bg-blue-50" : ""
                                            }`}
                                        style={{ minHeight: "500px" }}
                                    >
                                        {columns[status.key]?.map((ticket: any, idx: number) => (
                                            canDrag ? (
                                                <Draggable draggableId={ticket.id.toString()} index={idx} key={ticket.id}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`bg-white border border-border rounded-lg mb-4 shadow-md hover:shadow-lg hover:border-primary/50 transition-all duration-200 ${snapshot.isDragging ? "ring-2 ring-primary/50 shadow-xl transform rotate-2" : ""
                                                                }`}
                                                            style={provided.draggableProps.style}
                                                            onClick={() => onTicketClick(ticket)}
                                                        >
                                                            <div className="p-4">
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                                                                            {ticket.code}
                                                                        </span>
                                                                        {ticket.priority && (
                                                                            <span className={`inline-block w-2 h-2 rounded-full ${ticket.priority === 'high' ? 'bg-red-500' :
                                                                                ticket.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                                                                }`}></span>
                                                                        )}
                                                                    </div>

                                                                    <button
                                                                        className="group relative text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-primary/10 transition-all duration-200 hover:shadow-md border border-transparent hover:border-primary/20"
                                                                        onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === ticket.id ? null : ticket.id); }}
                                                                    >
                                                                        <MoreVertical size={16} className="transition-transform group-hover:scale-110" />
                                                                        <div className="absolute -inset-1 bg-primary/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 -z-10"></div>
                                                                    </button>
                                                                </div>

                                                                <h4 className="text-sm font-semibold text-foreground mb-3 line-clamp-2 leading-tight">
                                                                    {ticket.title}
                                                                </h4>

                                                                {/* Member Card */}
                                                                <MemberCard ticket={ticket} />

                                                                <div className="flex flex-wrap gap-2 mb-4 items-center">
                                                                    <span className="px-3 py-1 bg-gradient-to-r from-accent/20 to-accent/10 text-accent rounded-full text-xs font-semibold shadow-sm flex items-center border border-accent/20">
                                                                        <Tag className="inline w-3 h-3 mr-1.5" />
                                                                        {ticket.category}
                                                                    </span>
                                                                    {ticket.device && (
                                                                        <span className="px-3 py-1 bg-gradient-to-r from-primary/20 to-primary/10 text-primary rounded-full text-xs font-semibold shadow-sm flex items-center border border-primary/20">
                                                                            {ticket.device.icon_id ? (
                                                                                <DeviceIcon deviceIconId={ticket.device.icon_id} size={12} className="mr-1.5" />
                                                                            ) : (
                                                                                <Monitor className="inline w-3 h-3 mr-1.5" />
                                                                            )}
                                                                            {ticket.device.name || (ticket.device.name_device && ticket.device.name_device.name) || "Device"}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="flex justify-between items-center text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
                                                                    <div className="flex items-center">
                                                                        <CalendarIcon className="w-3 h-3 mr-1.5" />
                                                                        {new Date(ticket.created_at).toLocaleDateString()}
                                                                    </div>

                                                                    {ticket.technical && (
                                                                        <TooltipProvider>
                                                                            <Tooltip delayDuration={200}>
                                                                                <TooltipTrigger asChild>
                                                                                    <div className="flex items-center cursor-pointer group">
                                                                                        {ticket.technical.photo ? (
                                                                                            <img
                                                                                                src={ticket.technical.photo.startsWith('http')
                                                                                                    ? ticket.technical.photo
                                                                                                    : `/storage/${ticket.technical.photo}`}
                                                                                                alt={ticket.technical.name}
                                                                                                className="w-7 h-7 rounded-full border-2 border-blue-300 shadow-md group-hover:scale-105 transition-transform"
                                                                                            />
                                                                                        ) : (
                                                                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center text-white text-base font-bold">
                                                                                                {ticket.technical.name?.substring(0, 1) || '?'}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent className="bg-gray-900 text-white px-3 py-2 text-xs rounded shadow-lg">
                                                                                    <div className="font-semibold text-base">{ticket.technical.name}</div>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {menuOpen === ticket.id && (
                                                                <div className="border-t border-border bg-gradient-to-b from-background to-muted/30 backdrop-blur-sm">
                                                                    <div className="p-3 space-y-1">
                                                                        {isTechnicalDefault && (
                                                                            <button
                                                                                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-primary hover:text-primary-foreground hover:bg-primary rounded-lg transition-all duration-200 group border border-transparent hover:border-primary/20 hover:shadow-md"
                                                                                onClick={e => {
                                                                                    e.stopPropagation();
                                                                                    setMenuOpen(null);
                                                                                    if (props.onAssign) {
                                                                                        props.onAssign(ticket);
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary-foreground/10 transition-colors">
                                                                                    <Share2 size={16} className="transition-transform group-hover:scale-110" />
                                                                                </div>
                                                                                <div className="flex flex-col items-start">
                                                                                    <span className="font-semibold">Assign Technician</span>
                                                                                    <span className="text-xs text-muted-foreground group-hover:text-primary-foreground/80">Manage ticket assignment</span>
                                                                                </div>
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-accent hover:text-accent-foreground hover:bg-accent rounded-lg transition-all duration-200 group border border-transparent hover:border-accent/20 hover:shadow-md"
                                                                            onClick={e => {
                                                                                e.stopPropagation();
                                                                                setMenuOpen(null);
                                                                                if (props.onComment) {
                                                                                    props.onComment(ticket);
                                                                                }
                                                                            }}
                                                                        >
                                                                            <div className="p-1.5 rounded-md bg-accent/10 group-hover:bg-accent-foreground/10 transition-colors">
                                                                                <MessageSquare size={16} className="transition-transform group-hover:scale-110" />
                                                                            </div>
                                                                            <div className="flex flex-col items-start">
                                                                                <span className="font-semibold">Add Comment</span>
                                                                                <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">Update ticket progress</span>
                                                                            </div>
                                                                        </button>

                                                                        {/* Status change quick actions for technicians and managers */}
                                                                        {(isTechnical || isManager) && ticket.status !== 'resolved' && ticket.status !== 'closed' && ticket.status !== 'cancelled' && (
                                                                            <div className="pt-2 border-t border-border/50">
                                                                                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2 px-1">Quick Actions</div>
                                                                                <div className="space-y-1">
                                                                                    {ticket.status !== 'in_progress' && (
                                                                                        <button
                                                                                            className="flex items-center gap-3 w-full px-3 py-2 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-all duration-200 group"
                                                                                            onClick={e => {
                                                                                                e.stopPropagation();
                                                                                                setMenuOpen(null);
                                                                                                router.post(`/tickets/${ticket.id}/update-status`, { status: 'in_progress' }, { preserveScroll: true });
                                                                                            }}
                                                                                        >
                                                                                            <Clock size={14} className="text-blue-500" />
                                                                                            Start Progress
                                                                                        </button>
                                                                                    )}
                                                                                    {ticket.status === 'in_progress' && (
                                                                                        <button
                                                                                            className="flex items-center gap-3 w-full px-3 py-2 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-all duration-200 group"
                                                                                            onClick={e => {
                                                                                                e.stopPropagation();
                                                                                                setMenuOpen(null);
                                                                                                if (onStatusChangeWithComment) {
                                                                                                    onStatusChangeWithComment(ticket, 'resolved');
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            <CheckCircle size={14} className="text-emerald-500" />
                                                                                            Mark Resolved
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Delete button - only for admins */}
                                                                        {isSuperAdmin && (
                                                                            <div className="pt-2 border-t border-border/50">
                                                                                <button
                                                                                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 group border border-transparent hover:border-red-200 hover:shadow-md"
                                                                                    onClick={e => {
                                                                                        e.stopPropagation();
                                                                                        setMenuOpen(null);
                                                                                        if (props.onDelete) {
                                                                                            props.onDelete(ticket);
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <div className="p-1.5 rounded-md bg-red-100 group-hover:bg-red-200 transition-colors">
                                                                                        <Trash2 size={16} className="transition-transform group-hover:scale-110" />
                                                                                    </div>
                                                                                    <div className="flex flex-col items-start">
                                                                                        <span className="font-semibold">Delete Ticket</span>
                                                                                        <span className="text-xs text-muted-foreground group-hover:text-red-700/80">Permanently remove ticket</span>
                                                                                    </div>
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ) : (
                                                <div
                                                    key={ticket.id}
                                                    className="bg-white border border-gray-200 rounded mb-3 shadow-sm p-3 hover:border-blue-400 transition-colors"
                                                    onClick={() => onTicketClick(ticket)}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center">
                                                            <span className="text-sm font-semibold text-blue-600 mr-2">
                                                                {ticket.code}
                                                            </span>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                                ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                                                    ticket.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                                                                        ticket.status === 'open' ? 'bg-orange-100 text-orange-800' :
                                                                            'bg-red-100 text-red-800'
                                                                }`}>
                                                                {status.label}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <h4 className="text-sm font-medium text-gray-800 mb-3">
                                                        {ticket.title}
                                                    </h4>

                                                    {/* Member Card */}
                                                    <MemberCard ticket={ticket} />

                                                    <div className="flex flex-wrap gap-2 mb-3 items-center">
                                                        <span className="px-2 py-0.5 bg-gradient-to-r from-purple-200 to-purple-100 text-purple-800 rounded-full text-xs font-semibold shadow-sm flex items-center">
                                                            <Tag className="inline w-3 h-3 mr-1 text-purple-400" />
                                                            {ticket.category}
                                                        </span>
                                                        {ticket.device && (
                                                            <span className="px-2 py-0.5 bg-gradient-to-r from-blue-200 to-blue-100 text-blue-800 rounded-full text-xs font-semibold shadow-sm flex items-center">
                                                                {ticket.device.icon_id ? (
                                                                    <DeviceIcon deviceIconId={ticket.device.icon_id} size={12} className="mr-1 text-blue-400" />
                                                                ) : (
                                                                    <Monitor className="inline w-3 h-3 mr-1 text-blue-400" />
                                                                )}
                                                                {ticket.device.name || (ticket.device.name_device && ticket.device.name_device.name) || "Dispositivo"}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex justify-between items-center text-xs text-gray-500 mt-4">
                                                        <div className="flex items-center">
                                                            <CalendarIcon className="w-3 h-3 mr-1" />
                                                            {new Date(ticket.created_at).toLocaleDateString()}
                                                        </div>
                                                        {/* Creador del ticket */}
                                                        {ticket.user && ticket.user.tenant && (
                                                            <TooltipProvider>
                                                                <Tooltip delayDuration={200}>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="flex items-center cursor-pointer">
                                                                            {ticket.user.tenant.photo ? (
                                                                                <img
                                                                                    src={ticket.user.tenant.photo.startsWith('http')
                                                                                        ? ticket.user.tenant.photo
                                                                                        : `/storage/${ticket.user.tenant.photo}`}
                                                                                    alt={ticket.user.tenant.name}
                                                                                    className="w-7 h-7 rounded-full border border-white shadow-sm"
                                                                                />
                                                                            ) : (
                                                                                <div className="w-7 h-7 rounded-full bg-slate-400 flex items-center justify-center text-white text-xs font-bold">
                                                                                    {ticket.user.tenant.name?.substring(0, 1) || '?'}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className="bg-gray-900 text-white px-3 py-2 text-xs rounded shadow-lg">
                                                                        <div className="font-semibold">{ticket.user.tenant.name}</div>
                                                                        <div className="text-gray-300">{ticket.user.tenant.apartment?.name || 'No apartment'}</div>
                                                                        <div className="text-gray-400">{ticket.user.tenant.apartment?.building?.name || 'No building'}</div>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                    </div>



                                                </div>
                                            )
                                        ))}

                                        {columns[status.key]?.length === 0 && (
                                            <div className="bg-gradient-to-br from-background to-muted/30 border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors hover:border-primary/30">
                                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                                                    <status.icon className="w-6 h-6 text-muted-foreground" />
                                                </div>
                                                <div className="text-muted-foreground font-medium mb-1">No tickets here</div>
                                                <div className="text-xs text-muted-foreground/70">Drag tickets here or create new ones</div>
                                            </div>
                                        )}

                                        {provided.placeholder}
                                    </div>
                                </div>
                            )}
                        </Droppable>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}