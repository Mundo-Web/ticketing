
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, User } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { useState } from 'react';

import { Edit, Trash2, MoreHorizontal, CheckCircle, XCircle, Loader2, Eye, Plus, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tickets', href: '/tickets' },
];

// Status badge for ticket states
const statusMap: Record<string, { label: string; color: string }> = {
    open: { label: 'Abierto', color: 'bg-blue-100 text-blue-800' },
    in_progress: { label: 'En progreso', color: 'bg-yellow-100 text-yellow-800' },
    resolved: { label: 'Resuelto', color: 'bg-green-100 text-green-800' },
    closed: { label: 'Cerrado', color: 'bg-gray-200 text-gray-700' },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

function StatusBadge({ status }: { status: string }) {
    const s = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
    );
}

function Pagination({ links, meta }: { links: any[]; meta: any }) {
    if (!links) return null;
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="text-sm text-gray-500">
                Mostrando {meta?.per_page * (meta?.current_page - 1) + 1} -{' '}
                {Math.min(meta?.per_page * meta?.current_page, meta?.total)} de {meta?.total}
            </div>
            <div className="flex gap-1">
                {links.map((link, index) => (
                    link.url && (
                        <Link
                            key={index}
                            href={link.url}
                            className={`px-3 py-1 rounded-lg ${link.active
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    )
                ))}
            </div>
        </div>
    );
}

// Main Ticket List Page

interface Ticket {
    id: number;
    device?: {
        name?: string;
        name_device?: {
            name: string;
        };
    };
    category: string;
    title: string;
    description: string;
    status: string;
    created_at?: string;
    updated_at?: string;
    // Add other fields as needed
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

interface TicketsProps {
    tickets: {
        data: Ticket[];
        links: PaginationLink[];
        meta: PaginationMeta;
    };
}

export default function TicketsIndex({ tickets }: TicketsProps) {
    // State for modals and forms
    const [showHistoryModal, setShowHistoryModal] = useState<{ open: boolean, ticketId?: number }>({ open: false });
    const [showAssignModal, setShowAssignModal] = useState<{ open: boolean, ticketId?: number }>({ open: false });
    const [historyText, setHistoryText] = useState('');
    const [historyAction, setHistoryAction] = useState('comment');
    const [assignTechnicalId, setAssignTechnicalId] = useState<number | null>(null);
    const [assigning, setAssigning] = useState(false);
    const [addingHistory, setAddingHistory] = useState(false);
    const [technicals, setTechnicals] = useState<any[]>([]);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [viewTicket, setViewTicket] = useState<any | null>(null);
    const [viewLoading, setViewLoading] = useState(false);
    const [statusLoadingId, setStatusLoadingId] = useState<number | null>(null);
    const { auth } = usePage().props as any;

    const handleDelete = (ticket: any) => {
        if (!window.confirm('¿Eliminar este ticket?')) return;
        setDeletingId(ticket.id);
        router.delete(`/tickets/${ticket.id}`, {
            preserveScroll: true,
            onFinish: () => setDeletingId(null),
        });
    };

    const handleStatusChange = (ticket: any, newStatus: string) => {
        setStatusLoadingId(ticket.id);
        router.put(`/tickets/${ticket.id}`, { status: newStatus }, {
            preserveScroll: true,
            onFinish: () => setStatusLoadingId(null),
        });
    };

    // Define allowed status transitions
    const getNextStatuses = (status: string) => {
        switch (status) {
            case 'open':
                return ['in_progress', 'cancelled'];
            case 'in_progress':
                return ['resolved', 'cancelled'];
            case 'resolved':
                return ['closed'];
            default:
                return [];
        }
    };

    // Cargar ticket + historial al abrir modal
    const handleOpenDetails = async (ticketId: number) => {
        setViewLoading(true);
        try {
            const response = await fetch(`/tickets/${ticketId}`, {
                headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) throw new Error('Error al cargar ticket');
            const data = await response.json();
            setViewTicket(data.ticket);
        } catch (e) {
            setViewTicket(null);
        } finally {
            setViewLoading(false);
        }
    };

    // Load technicals for assignment
    const loadTechnicals = async () => {
        try {
            const response = await fetch('/technicals-list', { headers: { 'Accept': 'application/json' } });
            if (!response.ok) throw new Error('Error al cargar técnicos');
            const data = await response.json();
            setTechnicals(data.technicals || []);
        } catch (e) {
            setTechnicals([]);
        }
    };

    const handleCloseDetails = () => {
        setViewTicket(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tickets" />
            <div className="flex flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">Tickets</h1>
                    {/* Add button for modal ticket creation if needed */}
                </div>
                <div className="rounded-xl border shadow-sm overflow-hidden bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Dispositivo</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead>Título</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Creado</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tickets.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">No hay tickets.</TableCell>
                                </TableRow>
                            ) : (
                                tickets.data.map((ticket: any) => (
                                    <TableRow key={ticket.id}>
                                        <TableCell>
                                            {ticket.device?.name_device?.name || ticket.device?.name || '-'}
                                        </TableCell>
                                        <TableCell>{ticket.category}</TableCell>
                                        <TableCell className="font-medium">{ticket.title}</TableCell>
                                        <TableCell className="max-w-[200px] truncate">{ticket.description}</TableCell>
                                        <TableCell>
                                            <StatusBadge status={ticket.status} />
                                        </TableCell>
                                        <TableCell>
                                            {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2 items-center">
                                                {/* View details */}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Ver detalles"
                                                    onClick={() => handleOpenDetails(ticket.id)}
                                                >
                                                    <Eye className="w-4 h-4 text-blue-600" />
                                                </Button>
{auth.user?.roles.includes('technical') && (<>

                                                {/* Add history action */}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Agregar acción/historial"
                                                    onClick={() => setShowHistoryModal({ open: true, ticketId: ticket.id })}
                                                >
                                                    <Plus className="w-4 h-4 text-green-600" />
                                                </Button>
                                                {/* Assign/derive technical */}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Derivar/Asignar técnico"
                                                    onClick={async () => { await loadTechnicals(); setShowAssignModal({ open: true, ticketId: ticket.id }); }}
                                                >
                                                    <Share2 className="w-4 h-4 text-purple-600" />
                                                </Button>
                                                {/* Status change dropdown */}
                                                {getNextStatuses(ticket.status).length > 0 && (
                                                    <select
                                                        className="border rounded px-2 py-1 text-xs"
                                                        value=""
                                                        disabled={statusLoadingId === ticket.id}
                                                        onChange={e => handleStatusChange(ticket, e.target.value)}
                                                    >
                                                        <option value="" disabled>Cambiar estado</option>
                                                        {getNextStatuses(ticket.status).map(status => (
                                                            <option key={status} value={status}>{statusMap[status]?.label || status}</option>
                                                        ))}
                                                    </select>
                                                )}
                                                {/* Delete action: only allow if open or cancelled */}
                                                {(ticket.status === 'open' || ticket.status === 'cancelled') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Eliminar"
                                                        disabled={deletingId === ticket.id}
                                                        onClick={() => handleDelete(ticket)}
                                                    >
                                                        {deletingId === ticket.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4 text-red-600" />
                                                        )}
                                                    </Button>
                                                )}
</>)}
                                            </div>
                                        </TableCell>
                                        <Dialog open={showHistoryModal.open} onOpenChange={open => setShowHistoryModal({ open, ticketId: showHistoryModal.ticketId })}>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Agregar acción/historial al ticket</DialogTitle>
                                                </DialogHeader>
                                                <form
                                                    onSubmit={async e => {
                                                        e.preventDefault();
                                                        setAddingHistory(true);
                                                        try {
                                                            const meta = document.querySelector('meta[name="csrf-token"]');
                                                            const csrf = (meta && meta.getAttribute('content')) || '';
                                                            const res = await fetch(`/tickets/${showHistoryModal.ticketId}/add-history`, {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': csrf },
                                                                body: JSON.stringify({ action: historyAction, description: historyText })
                                                            });
                                                            if (!res.ok) throw new Error('Error al agregar historial');
                                                            setShowHistoryModal({ open: false });
                                                            setHistoryText('');
                                                            setHistoryAction('comment');
                                                            router.reload({ only: ['tickets'] });
                                                        } catch (e) {
                                                            alert('Error al agregar historial');
                                                        } finally {
                                                            setAddingHistory(false);
                                                        }
                                                    }}
                                                    className="space-y-4"
                                                >
                                                    <label htmlFor="Action" className="block text-sm font-medium text-gray-700">Acción</label>
                                                    <input
                                                        className="w-full border rounded p-2"
                                                        value={historyAction}
                                                        onChange={e => setHistoryAction(e.target.value)}
                                                        placeholder="Ej: comment, resolucion, consult, etc."
                                                        required
                                                    />
                                                    <label htmlFor="Description" className="block text-sm font-medium text-gray-700">Descripción</label>
                                                    <textarea
                                                        className="w-full border rounded p-2 min-h-[80px]"
                                                        value={historyText}
                                                        onChange={e => setHistoryText(e.target.value)}
                                                        placeholder="Describe la acción realizada o comentario"
                                                        required
                                                    />
                                                    <DialogFooter>
                                                        <DialogClose asChild>
                                                            <Button type="button" variant="outline">Cancelar</Button>
                                                        </DialogClose>
                                                        <Button type="submit" disabled={addingHistory}>{addingHistory ? 'Guardando...' : 'Guardar'}</Button>
                                                    </DialogFooter>
                                                </form>
                                            </DialogContent>
                                        </Dialog>

                                        {/* Modal: Assign/Derive Technical */}
                                        <Dialog open={showAssignModal.open} onOpenChange={open => setShowAssignModal({ open, ticketId: showAssignModal.ticketId })}>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Derivar/Asignar técnico al ticket</DialogTitle>
                                                </DialogHeader>
                                                <form
                                                    onSubmit={async e => {
                                                        e.preventDefault();
                                                        if (!assignTechnicalId) return;
                                                        setAssigning(true);
                                                        try {
                                                            const meta = document.querySelector('meta[name="csrf-token"]');
                                                            const csrf = (meta && meta.getAttribute('content')) || '';
                                                            const res = await fetch(`/tickets/${showAssignModal.ticketId}/assign-technical`, {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': csrf },
                                                                body: JSON.stringify({ technical_id: assignTechnicalId })
                                                            });
                                                            if (!res.ok) throw new Error('Error al asignar técnico');
                                                            setShowAssignModal({ open: false });
                                                            setAssignTechnicalId(null);
                                                            router.reload({ only: ['tickets'] });
                                                        } catch (e) {
                                                            alert('Error al asignar técnico');
                                                        } finally {
                                                            setAssigning(false);
                                                        }
                                                    }}
                                                    className="space-y-4"
                                                >
                                                    <select
                                                        className="w-full border rounded p-2"
                                                        value={assignTechnicalId || ''}
                                                        onChange={e => setAssignTechnicalId(Number(e.target.value))}
                                                        required
                                                    >
                                                        <option value="" disabled>Selecciona un técnico</option>
                                                        {technicals.map(t => (
                                                            <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                                                        ))}
                                                    </select>
                                                    <DialogFooter>
                                                        <DialogClose asChild>
                                                            <Button type="button" variant="outline">Cancelar</Button>
                                                        </DialogClose>
                                                        <Button type="submit" disabled={assigning}>{assigning ? 'Asignando...' : 'Asignar'}</Button>
                                                    </DialogFooter>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                <Pagination links={tickets.links} meta={tickets.meta} />
            </div>
            {/* View Ticket Modal */}
            <Dialog open={!!viewTicket || viewLoading} onOpenChange={open => { if (!open) handleCloseDetails(); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detalles del Ticket</DialogTitle>
                    </DialogHeader>
                    {viewLoading && (
                        <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
                    )}
                    {viewTicket && !viewLoading && (
                        <>
                            <div className="flex flex-col gap-4">
                                <div className="grid grid-cols-2 gap-2">
                                    <div><b>ID:</b> {viewTicket.id}</div>
                                    <div><b>Código:</b> {viewTicket.code}</div>
                                    <div><b>Dispositivo:</b> {viewTicket.device?.name_device?.name || viewTicket.device?.name || '-'}</div>
                                    <div><b>Categoría:</b> {viewTicket.category}</div>
                                    <div><b>Título:</b> {viewTicket.title}</div>
                                    <div><b>Descripción:</b> {viewTicket.description}</div>
                                    <div><b>Estado:</b> <StatusBadge status={viewTicket.status} /></div>
                                    <div><b>Creado:</b> {viewTicket.created_at ? new Date(viewTicket.created_at).toLocaleString() : '-'}</div>
                                    <div><b>Actualizado:</b> {viewTicket.updated_at ? new Date(viewTicket.updated_at).toLocaleString() : '-'}</div>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowHistoryModal({ open: true, ticketId: viewTicket.id })}
                                        title="Agregar acción/historial"
                                    >
                                        <Plus className="w-4 h-4 text-green-600 mr-1" /> Agregar acción
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => { await loadTechnicals(); setShowAssignModal({ open: true, ticketId: viewTicket.id }); }}
                                        title="Derivar/Asignar técnico"
                                    >
                                        <Share2 className="w-4 h-4 text-purple-600 mr-1" /> Derivar técnico
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mt-4 mb-2">Historial</h3>
                                <div className="bg-white rounded-lg shadow border divide-y max-h-60 overflow-y-auto">
                                    {(!viewTicket.histories || viewTicket.histories.length === 0) && (
                                        <div className="p-4 text-gray-500 text-center">No hay historial para este ticket.</div>
                                    )}
                                    {viewTicket.histories && viewTicket.histories.map((h: any) => (
                                        <div key={h.id} className="flex flex-col md:flex-row md:items-center gap-2 p-4">
                                            <div className="flex-1">
                                                <div className="font-medium text-sm text-blue-700">{h.action.replace('_', ' ').toUpperCase()}</div>
                                                <div className="text-gray-700 text-sm">{h.description}</div>
                                                {h.meta && (
                                                    <div className="text-xs text-gray-400 mt-1">{typeof h.meta === 'string' ? h.meta : JSON.stringify(h.meta)}</div>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end min-w-[120px]">
                                                <div className="text-xs text-gray-500">{h.user ? h.user.name : 'Sistema'}</div>
                                                <div className="text-xs text-gray-400">{new Date(h.created_at).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="secondary">Cerrar</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
