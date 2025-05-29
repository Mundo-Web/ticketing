import React, { useState, useEffect } from "react";
import { Share2, MessageSquare, CalendarIcon, Clock, AlertCircle, CheckCircle, XCircle, Filter, Search, MoreVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { router } from "@inertiajs/react";

const getStatuses = (props: any) => {
    if (props.isTechnicalDefault) {
        return [
            { key: "recents", label: "POR HACER", icon: AlertCircle, color: "bg-orange-500" },
            { key: "in_progress", label: "EN CURSO", icon: Clock, color: "bg-blue-500" },
            { key: "resolved", label: "POR REVISAR", icon: CheckCircle, color: "bg-green-500" },
            { key: "closed", label: "CERRADO", icon: XCircle, color: "bg-gray-400" },
            { key: "cancelled", label: "CANCELADO", icon: XCircle, color: "bg-red-500" },
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
    const [showFilters, setShowFilters] = useState(false);    useEffect(() => {
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

    const filteredTickets = tickets.filter((t: any) => {
        if (isTechnicalDefault && selectedTechnicalId && t.technical_id !== selectedTechnicalId) {
            return false;
        }

        if (searchQuery) {
            const search = searchQuery.toLowerCase();
            return t.id.toString().includes(search) ||
                t.title.toLowerCase().includes(search) ||
                t.description?.toLowerCase().includes(search) ||
                t.category?.toLowerCase().includes(search) ||
                `TICK-${t.id}`.includes(search);
        }

        return true;
    });

    const statuses = getStatuses({ isTechnicalDefault, isTechnical, isSuperAdmin, isMember });

    const groupTickets = () => statuses.reduce((acc: any, status) => {
        if (status.key === "recents") {
            acc[status.key] = filteredTickets.filter((t: any) => t.status === "open");
        } else {
            acc[status.key] = filteredTickets.filter((t: any) => t.status === status.key);
        }
        return acc;
    }, {});

    const [columns, setColumns] = useState(groupTickets());

    useEffect(() => {
        setColumns(groupTickets());
    }, [filteredTickets, showRecents]);

    const canDrag = isTechnical || isTechnicalDefault;

    const onDragEnd = (result: any) => {
        if (!canDrag) return;
        if (!result.destination) return;
        const { source, destination, draggableId } = result;
        if (source.droppableId === destination.droppableId) return;

        const ticket = columns[source.droppableId].find((t: any) => t.id === Number(draggableId));
        if (!ticket) return;

        router.post(
            `/tickets/${ticket.id}/update-status`,
            { status: destination.droppableId },
            { preserveScroll: true }
        );
    };

    return (
        <div className="flex flex-col h-full ">
            {/* Jira-style header */}
            <div className="bg-white border-b border-gray-300 py-3 px-4 mb-4 shadow-sm">
                <div className="flex items-center justify-start">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-gray-800">Tablero de Tickets</h1>
                        <div className="relative">
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

                                <div>
                                    {/*<label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                                    Técnicos
                                </label> */}
                                    <div className="flex flex-wrap gap-2">
                                        {technicals.map(t => (
                                            <div
                                                key={t.id}
                                                className={`flex items-center gap-2 px-3 py-1 text-xs rounded-full font-medium cursor-pointer ${selectedTechnicalId === t.id
                                                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                                    }`}
                                                onClick={() => setSelectedTechnicalId(selectedTechnicalId === t.id ? null : t.id)}
                                            >
                                                {t.photo ? (
                                                    <img
                                                        src={t.photo.startsWith('http') ? t.photo : `/storage/${t.photo}`}
                                                        alt={t.name}
                                                        className="w-6 h-6 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
                                                        {t.name.substring(0, 1)}
                                                    </div>
                                                )}
                                                <span>{t.name.split(' ')[0]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
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
                                                                            TICK-{ticket.id}
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
                                                                TICK-{ticket.id}
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