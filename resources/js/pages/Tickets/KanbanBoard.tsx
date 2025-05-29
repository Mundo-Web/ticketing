import React, { useState, useEffect, Fragment, useCallback, useMemo } from "react";
import { Share2, MessageSquare, CalendarIcon, Clock, AlertCircle, CheckCircle, XCircle, Filter, Search, MoreVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { router } from "@inertiajs/react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@radix-ui/react-tooltip";

const getStatuses = (props: any) => {
    if (props.isTechnicalDefault) {
        return [
            { key: "recents", label: "POR HACER", icon: AlertCircle, color: "bg-orange-500" },
            { key: "in_progress", label: "EN CURSO", icon: Clock, color: "bg-blue-500" },
            { key: "resolved", label: "POR REVISAR", icon: CheckCircle, color: "bg-green-500" },
          //  { key: "closed", label: "CERRADO", icon: XCircle, color: "bg-gray-400" },
            //{ key: "cancelled", label: "CANCELADO", icon: XCircle, color: "bg-red-500" },
        ];
    }
    if (props.isTechnical) {
        return [
            { key: "in_progress", label: "EN CURSO", icon: Clock, color: "bg-blue-500" },
            { key: "resolved", label: "POR REVISAR", icon: CheckCircle, color: "bg-green-500" },
            { key: "closed", label: "CERRADO", icon: XCircle, color: "bg-gray-400" },
            { key: "cancelled", label: "CANCELADO", icon: XCircle, color: "bg-red-500" },
        ];
    }
    return [
        { key: "open", label: "POR HACER", icon: AlertCircle, color: "bg-orange-500" },
        { key: "in_progress", label: "EN CURSO", icon: Clock, color: "bg-blue-500" },
        { key: "resolved", label: "POR REVISAR", icon: CheckCircle, color: "bg-green-500" },
        { key: "closed", label: "CERRADO", icon: XCircle, color: "bg-gray-400" },
        { key: "cancelled", label: "CANCELADO", icon: XCircle, color: "bg-red-500" },
    ];
};

export default function KanbanBoard(props: any) {
    const [menuOpen, setMenuOpen] = useState<number | null>(null);
    const { tickets, user, onTicketClick, isTechnicalDefault, isTechnical, isSuperAdmin, isMember } = props;
    const [showRecents, setShowRecents] = useState(isTechnicalDefault);
    const [searchQuery, setSearchQuery] = useState("");
    const [technicals, setTechnicals] = useState<any[]>([]);
    const [selectedTechnicalId, setSelectedTechnicalId] = useState<number | null>(null);
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
    }, []);

    // Memoizamos filteredTickets para evitar recálculos innecesarios
    const filteredTickets = useMemo(() => {
        return tickets.filter((t: any) => {
            // Filtro por técnico (solo se aplica si es jefe técnico y ha seleccionado un técnico)
            if (isTechnicalDefault && selectedTechnicalId && t.technical_id !== selectedTechnicalId) {
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
    }, [tickets, isTechnicalDefault, selectedTechnicalId, searchQuery]);// Memoizamos los estados para evitar recálculos innecesarios
    const statuses = useMemo(() => {
        return getStatuses({ isTechnicalDefault, isTechnical, isSuperAdmin, isMember });
    }, [isTechnicalDefault, isTechnical, isSuperAdmin, isMember]);

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
    }, [currentColumns]); const canDrag = isTechnical || isTechnicalDefault;    // Memoizamos la función onDragEnd para evitar recreaciones innecesarias
    const onDragEnd = useCallback((result: any) => {
        if (!canDrag) return;
        if (!result.destination) return;
        const { source, destination, draggableId } = result;
        if (source.droppableId === destination.droppableId) return;

        const ticket = columns[source.droppableId]?.find((t: any) => t.id === Number(draggableId));
        if (!ticket) return;

        router.post(
            `/tickets/${ticket.id}/update-status`,
            { status: destination.droppableId },
            { preserveScroll: true }
        );
    }, [canDrag, columns]);

    return (
        <div className="flex flex-col h-full ">
            {/* Jira-style header */}
            <div className="bg-white border-b border-gray-300 py-3 px-4 mb-4 shadow-sm">                    <div className="flex items-center justify-start">
                <div className="flex items-center gap-3">                        <h1 className="text-xl font-bold text-gray-800">
                    Tablero de Tickets

                </h1>
                    {/* <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar tickets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                            />
                            <div className="absolute left-3 top-2.5 text-gray-400">
                                <Search size={16} />
                            </div>
                        </div> */}
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
                            </div> */}                                {/* Solo mostrar la sección de técnicos si es jefe técnico (isTechnicalDefault) */}
                            {isTechnicalDefault && (                                <div>
                                    
                                    <div className="ml-4 flex flex-wrap gap-2 items-center">
                                        {technicals.map(t => (                                            <TooltipProvider key={t.id}>
                                                <Tooltip delayDuration={300}>
                                                    <TooltipTrigger asChild>
                                                        <div 
                                                            className={`cursor-pointer relative p-0.5 rounded-full transition-all duration-200 ${
                                                                selectedTechnicalId === t.id 
                                                                ? 'bg-blue-500 ring-2 ring-blue-300 scale-110' 
                                                                : 'hover:bg-gray-100'
                                                            }`}
                                                            onClick={() => setSelectedTechnicalId(selectedTechnicalId === t.id ? null : t.id)}
                                                        >
                                                            <img
                                                                src={t.photo?.startsWith('http') ? t.photo : `/storage/${t.photo}`}
                                                                alt={t.name}
                                                                className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                                            />
                                                            {selectedTechnicalId === t.id && (
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
                                                       {/** <p className="text-gray-300 text-[10px]">{t.email}</p> */}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>

                                        ))}                                        {isTechnicalDefault && selectedTechnicalId && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            onClick={() => setSelectedTechnicalId(null)}
                                                            className="ml-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-full font-medium shadow-sm border border-blue-200 transition-all duration-200"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                                            </svg>
                                                            Limpiar filtro
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-gray-800 text-white text-xs">
                                                        <p>Mostrar todos los técnicos</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
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
                                                            className={`bg-white border border-gray-200 rounded mb-3 shadow-sm hover:border-blue-400 transition-colors ${snapshot.isDragging ? "ring-2 ring-blue-300 shadow-md" : ""
                                                                }`}
                                                            style={provided.draggableProps.style}
                                                            onClick={() => onTicketClick(ticket)}
                                                        >
                                                            <div className="p-3">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div className="flex items-center">
                                                                        <span className="text-sm font-semibold text-blue-600 mr-2">
                                                                            {ticket.code}
                                                                        </span>
                                                                        {ticket.priority && (
                                                                            <span className={`inline-block w-2 h-2 rounded-full ${ticket.priority === 'high' ? 'bg-red-500' :
                                                                                ticket.priority === 'medium' ? 'bg-orange-400' : 'bg-green-500'
                                                                                }`}></span>
                                                                        )}
                                                                    </div>

                                                                    <button
                                                                        className="text-gray-500 hover:text-gray-700 p-1"
                                                                        onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === ticket.id ? null : ticket.id); }}
                                                                    >
                                                                        <MoreVertical size={16} />
                                                                    </button>
                                                                </div>

                                                                <h4 className="text-sm font-medium text-gray-800 mb-3">
                                                                    {ticket.title}
                                                                </h4>

                                                                <div className="flex flex-wrap gap-1 mb-3">
                                                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs">
                                                                        {ticket.category}
                                                                    </span>
                                                                    {ticket.device && (
                                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                                                                            {ticket.device.name || "Dispositivo"}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="flex justify-between items-center text-xs text-gray-500 mt-4">
                                                                    <div className="flex items-center">
                                                                        <CalendarIcon className="w-3 h-3 mr-1" />
                                                                        {new Date(ticket.created_at).toLocaleDateString()}
                                                                    </div>

                                                                    {ticket.technical && (
                                                                        <div className="flex items-center">
                                                                            {ticket.technical.photo ? (
                                                                                <img
                                                                                    src={ticket.technical.photo.startsWith('http')
                                                                                        ? ticket.technical.photo
                                                                                        : `/storage/${ticket.technical.photo}`}
                                                                                    alt={ticket.technical.name}
                                                                                    className="w-6 h-6 rounded-full border border-white shadow-sm"
                                                                                />
                                                                            ) : (
                                                                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                                                                                    {ticket.technical.name.substring(0, 1)}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {menuOpen === ticket.id && (
                                                                <div className="border-t border-gray-200 p-2 bg-gray-50">
                                                                    <button
                                                                        className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-200 rounded"
                                                                        onClick={e => { e.stopPropagation(); setMenuOpen(null); props.onAssign && props.onAssign(ticket); }}
                                                                    >
                                                                        <Share2 size={14} className="text-gray-500" />
                                                                        Asignar
                                                                    </button>
                                                                    <button
                                                                        className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-200 rounded"
                                                                        onClick={e => { e.stopPropagation(); setMenuOpen(null); props.onComment && props.onComment(ticket); }}
                                                                    >
                                                                        <MessageSquare size={14} className="text-gray-500" />
                                                                        Comentar
                                                                    </button>
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

                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs">
                                                            {ticket.category}
                                                        </span>
                                                    </div>

                                                    <div className="flex justify-between items-center text-xs text-gray-500 mt-4">
                                                        <div className="flex items-center">
                                                            <CalendarIcon className="w-3 h-3 mr-1" />
                                                            {new Date(ticket.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>



                                                </div>
                                            )
                                        ))}

                                        {columns[status.key]?.length === 0 && (
                                            <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                                <div className="text-gray-400 mb-1">No hay tickets en esta columna</div>
                                                <div className="text-xs text-gray-500">Arrastra tickets aquí o crea nuevos</div>
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