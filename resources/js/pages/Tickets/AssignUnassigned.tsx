import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    UserPlus, 
    Ticket, 
    AlertTriangle, 
    Clock,
    Building,
    Home,
    Smartphone,
    User,
    CheckCircle,
    ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

interface Technical {
    id: number;
    name: string;
    email: string;
    shift: string;
    status: boolean;
    is_default: boolean;
}

interface UnassignedTicket {
    id: number;
    code: string;
    title: string;
    description: string;
    category: string;
    status: string;
    created_at: string;
    device?: {
        name: string;
        name_device?: {
            name: string;
        };
    };
    user?: {
        tenant?: {
            name: string;
            apartment?: {
                name: string;
                building?: {
                    name: string;
                };
            };
        };
    };
}

interface AssignUnassignedProps {
    unassignedTickets: UnassignedTicket[];
    technicals: Technical[];
}

export default function AssignUnassigned({ unassignedTickets, technicals }: AssignUnassignedProps) {
    const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
    const [selectedTechnical, setSelectedTechnical] = useState<string>('');
    const [isAssigning, setIsAssigning] = useState(false);

    const handleTicketSelect = (ticketId: number) => {
        setSelectedTickets(prev => 
            prev.includes(ticketId) 
                ? prev.filter(id => id !== ticketId)
                : [...prev, ticketId]
        );
    };

    const handleSelectAll = () => {
        if (selectedTickets.length === unassignedTickets.length) {
            setSelectedTickets([]);
        } else {
            setSelectedTickets(unassignedTickets.map(ticket => ticket.id));
        }
    };

    const handleAssign = async () => {
        if (!selectedTechnical || selectedTickets.length === 0) {
            toast.error('Selecciona al menos un ticket y un técnico');
            return;
        }

        setIsAssigning(true);

        try {
            // Asignar cada ticket por separado
            for (const ticketId of selectedTickets) {
                await new Promise((resolve, reject) => {
                    router.post(`/tickets/${ticketId}/assign-technical`, {
                        technical_id: parseInt(selectedTechnical)
                    }, {
                        preserveScroll: true,
                        onSuccess: () => resolve(true),
                        onError: () => reject(),
                    });
                });
            }

            toast.success(`${selectedTickets.length} ticket(s) asignado(s) correctamente`);
            setSelectedTickets([]);
            setSelectedTechnical('');

            // Recargar la página para mostrar los tickets actualizados
            router.reload();

        } catch {
            toast.error('Error al asignar algunos tickets');
        } finally {
            setIsAssigning(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            'technical': 'bg-blue-100 text-blue-800',
            'maintenance': 'bg-green-100 text-green-800',
            'repair': 'bg-orange-100 text-orange-800',
            'installation': 'bg-purple-100 text-purple-800',
            'emergency': 'bg-red-100 text-red-800',
        };
        return colors[category] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AppLayout>
            <Head title="Asignar Tickets Sin Asignar" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
                <div className="container mx-auto px-8 py-16 space-y-12">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Button 
                                    variant="outline" 
                                    onClick={() => router.visit('/dashboard')}
                                    className="gap-2"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Volver al Dashboard
                                </Button>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-xl">
                                    <UserPlus className="h-8 w-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black bg-gradient-to-r from-slate-900 via-orange-700 to-slate-700 bg-clip-text text-transparent">
                                        Asignar Tickets Sin Asignar
                                    </h1>
                                    <p className="text-xl text-slate-600 mt-2">
                                        {unassignedTickets.length} tickets esperando asignación
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-orange-600">
                                    {unassignedTickets.length}
                                </div>
                                <div className="text-sm text-slate-600">Sin Asignar</div>
                            </div>
                        </div>
                    </div>

                    {/* Controles de Asignación */}
                    <Card className="border-0 shadow-xl bg-gradient-to-r from-white to-slate-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <AlertTriangle className="h-6 w-6 text-orange-600" />
                                Asignación Masiva
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">
                                        Seleccionar Técnico
                                    </label>
                                    <Select 
                                        value={selectedTechnical} 
                                        onValueChange={setSelectedTechnical}
                                    >
                                        <SelectTrigger className="h-12">
                                            <SelectValue placeholder="Elige un técnico..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {technicals.map(technical => (
                                                <SelectItem key={technical.id} value={technical.id.toString()}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">{technical.name}</span>
                                                            {technical.is_default && (
                                                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                                                    Jefe
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-slate-500">
                                                            ({technical.shift})
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-end">
                                    <Button 
                                        onClick={handleSelectAll}
                                        variant="outline"
                                        className="h-12 w-full"
                                    >
                                        {selectedTickets.length === unassignedTickets.length 
                                            ? 'Deseleccionar Todo' 
                                            : 'Seleccionar Todo'
                                        }
                                    </Button>
                                </div>

                                <div className="flex items-end">
                                    <Button 
                                        onClick={handleAssign}
                                        disabled={!selectedTechnical || selectedTickets.length === 0 || isAssigning}
                                        className="h-12 w-full bg-orange-600 hover:bg-orange-700"
                                    >
                                        {isAssigning ? (
                                            <>Asignando...</>
                                        ) : (
                                            <>
                                                <UserPlus className="h-4 w-4 mr-2" />
                                                Asignar {selectedTickets.length} Ticket(s)
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {selectedTickets.length > 0 && (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                    <p className="text-orange-800 font-medium">
                                        {selectedTickets.length} ticket(s) seleccionado(s) para asignar
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Lista de Tickets */}
                    {unassignedTickets.length === 0 ? (
                        <Card className="border-0 shadow-xl">
                            <CardContent className="p-16 text-center">
                                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                                    ¡Excelente trabajo!
                                </h3>
                                <p className="text-slate-600 text-lg">
                                    No hay tickets sin asignar en este momento
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6">
                            {unassignedTickets.map(ticket => (
                                <Card 
                                    key={ticket.id}
                                    className={`border-0 shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                                        selectedTickets.includes(ticket.id) 
                                            ? 'ring-2 ring-orange-500 bg-orange-50' 
                                            : 'hover:bg-slate-50'
                                    }`}
                                    onClick={() => handleTicketSelect(ticket.id)}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-6">
                                                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100">
                                                    <Ticket className="h-6 w-6 text-orange-600" />
                                                </div>

                                                <div className="space-y-3 flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-lg font-bold text-slate-900">
                                                            {ticket.title}
                                                        </h3>
                                                        <Badge variant="outline" className="text-xs">
                                                            {ticket.code}
                                                        </Badge>
                                                        <Badge className={getCategoryColor(ticket.category)}>
                                                            {ticket.category}
                                                        </Badge>
                                                    </div>

                                                    <p className="text-slate-600 line-clamp-2">
                                                        {ticket.description}
                                                    </p>

                                                    <div className="flex items-center gap-6 text-sm text-slate-500">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-4 w-4" />
                                                            {formatDate(ticket.created_at)}
                                                        </div>

                                                        {ticket.device && (
                                                            <div className="flex items-center gap-2">
                                                                <Smartphone className="h-4 w-4" />
                                                                {ticket.device.name || ticket.device.name_device?.name || 'Dispositivo'}
                                                            </div>
                                                        )}

                                                        {ticket.user?.tenant && (
                                                            <div className="flex items-center gap-2">
                                                                <User className="h-4 w-4" />
                                                                {ticket.user.tenant.name}
                                                            </div>
                                                        )}

                                                        {ticket.user?.tenant?.apartment && (
                                                            <div className="flex items-center gap-2">
                                                                <Home className="h-4 w-4" />
                                                                {ticket.user.tenant.apartment.name}
                                                            </div>
                                                        )}

                                                        {ticket.user?.tenant?.apartment?.building && (
                                                            <div className="flex items-center gap-2">
                                                                <Building className="h-4 w-4" />
                                                                {ticket.user.tenant.apartment.building.name}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTickets.includes(ticket.id)}
                                                    onChange={() => handleTicketSelect(ticket.id)}
                                                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
