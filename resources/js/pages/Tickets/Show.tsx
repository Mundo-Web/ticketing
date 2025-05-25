import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';


export default function TicketShow({ ticket }: { ticket: any }) {
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

    return (
        <AppLayout>
            <Head title={`Ticket ${ticket.code}`} />
            <div className="max-w-3xl mx-auto p-6">
                <h1 className="text-2xl font-bold mb-2">Ticket <span className="text-blue-700">{ticket.code}</span></h1>
                <div className="mb-6 text-gray-700">
                    <div><b>Dispositivo:</b> {ticket.device?.name_device?.name || ticket.device?.name || '-'}</div>
                    <div><b>Categoría:</b> {ticket.category}</div>
                    <div><b>Título:</b> {ticket.title}</div>
                    <div><b>Descripción:</b> {ticket.description}</div>
                    <div><b>Estado:</b> <StatusBadge status={ticket.status} /></div>
                    <div><b>Creado:</b> {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : '-'}</div>
                    <div><b>Actualizado:</b> {ticket.updated_at ? new Date(ticket.updated_at).toLocaleString() : '-'}</div>
                </div>
                <h2 className="text-xl font-semibold mb-2">Historial</h2>
                <div className="bg-white rounded-lg shadow border divide-y">
                    {ticket.histories.length === 0 && (
                        <div className="p-4 text-gray-500 text-center">No hay historial para este ticket.</div>
                    )}
                    {ticket.histories.map((h: any, idx: number) => (
                        <div key={h.id} className="flex flex-col md:flex-row md:items-center gap-2 p-4">
                            <div className="flex-1">
                                <div className="font-medium text-sm text-blue-700">{h.action.replace('_', ' ').toUpperCase()}</div>
                                <div className="text-gray-700 text-sm">{h.description}</div>
                                {h.meta && (
                                    <div className="text-xs text-gray-400 mt-1">{JSON.stringify(h.meta)}</div>
                                )}
                            </div>
                            <div className="flex flex-col items-end min-w-[120px]">
                                <div className="text-xs text-gray-500">{h.user ? h.user.name : 'Sistema'}</div>
                                <div className="text-xs text-gray-400">{new Date(h.created_at).toLocaleString()}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-6">
                    <Link href="/tickets">
                        <Button variant="secondary">Volver a la lista</Button>
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}
