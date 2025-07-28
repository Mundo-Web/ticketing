import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, PlayCircle, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Appointment {
    id: number;
    title: string;
    description?: string;
    address: string;
    scheduled_for: string;
    estimated_duration: number;
    status: string;
    notes?: string;
    member_instructions?: string;
    completion_notes?: string;
    started_at?: string;
    completed_at?: string;
    rating?: number;
    ticket: {
        id: number;
        title: string;
        code: string;
        user: {
            name: string;
            email: string;
        };
    };
    technical: {
        id: number;
        name: string;
        email: string;
    };
}

interface AppointmentsProps {
    appointments: Appointment[];
    calendarEvents: any[];
    technicals: any[];
    currentDate: string;
}

const statusConfig = {
    scheduled: {
        label: 'Programada',
        color: 'bg-blue-100 text-blue-800',
        icon: Calendar
    },
    in_progress: {
        label: 'En Progreso',
        color: 'bg-yellow-100 text-yellow-800',
        icon: PlayCircle
    },
    completed: {
        label: 'Completada',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle
    },
    cancelled: {
        label: 'Cancelada',
        color: 'bg-red-100 text-red-800',
        icon: XCircle
    },
    rescheduled: {
        label: 'Reagendada',
        color: 'bg-gray-100 text-gray-800',
        icon: RotateCcw
    }
};

export default function AppointmentsIndex({ appointments, technicals, currentDate }: AppointmentsProps) {
    const [selectedDate, setSelectedDate] = useState(new Date(currentDate));
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    // Filter appointments by selected date and status
    const filteredAppointments = appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.scheduled_for);
        const matchesDate = appointmentDate.toDateString() === selectedDate.toDateString();
        const matchesStatus = selectedStatus === 'all' || appointment.status === selectedStatus;
        return matchesDate && matchesStatus;
    });

    // Get upcoming appointments (next 7 days)
    const upcomingAppointments = appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.scheduled_for);
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        return appointmentDate >= today && appointmentDate <= nextWeek && appointment.status === 'scheduled';
    }).sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime());

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
        const IconComponent = config.icon;
        
        return (
            <Badge className={`${config.color} border-0`}>
                <IconComponent className="w-3 h-3 mr-1" />
                {config.label}
            </Badge>
        );
    };

    return (
        <AppLayout breadcrumbs={[{ title: "Calendar", href: "/appointments" }]}>
            <Head title="Appointments Calendar" />
            
            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Calendario de Citas</h1>
                    <p className="text-gray-600 mt-2">Gestiona todas las citas presenciales programadas</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Calendar Area */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Citas del {formatDate(selectedDate.toISOString())}</span>
                                    <div className="flex gap-2">
                                        <select
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                            className="px-3 py-1 border rounded-md text-sm"
                                        >
                                            <option value="all">Todos los estados</option>
                                            <option value="scheduled">Programadas</option>
                                            <option value="in_progress">En Progreso</option>
                                            <option value="completed">Completadas</option>
                                            <option value="cancelled">Canceladas</option>
                                        </select>
                                        <input
                                            type="date"
                                            value={selectedDate.toISOString().split('T')[0]}
                                            onChange={(e) => setSelectedDate(new Date(e.target.value))}
                                            className="px-3 py-1 border rounded-md text-sm"
                                        />
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {filteredAppointments.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <p>No hay citas programadas para esta fecha</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredAppointments.map((appointment) => (
                                            <div key={appointment.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">{appointment.title}</h3>
                                                        <p className="text-sm text-gray-600">Ticket #{appointment.ticket.code}</p>
                                                    </div>
                                                    {getStatusBadge(appointment.status)}
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{formatTime(appointment.scheduled_for)} ({appointment.estimated_duration} min)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4" />
                                                        <span>{appointment.technical.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4" />
                                                        <span className="truncate">{appointment.address}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4" />
                                                        <span>{appointment.ticket.user.name}</span>
                                                    </div>
                                                </div>

                                                {appointment.description && (
                                                    <p className="text-sm text-gray-600 mt-3 p-3 bg-gray-50 rounded">
                                                        {appointment.description}
                                                    </p>
                                                )}

                                                {appointment.member_instructions && (
                                                    <div className="mt-3 p-3 bg-blue-50 rounded">
                                                        <p className="text-sm font-medium text-blue-800">Instrucciones:</p>
                                                        <p className="text-sm text-blue-700">{appointment.member_instructions}</p>
                                                    </div>
                                                )}

                                                {appointment.completion_notes && (
                                                    <div className="mt-3 p-3 bg-green-50 rounded">
                                                        <p className="text-sm font-medium text-green-800">Notas de finalización:</p>
                                                        <p className="text-sm text-green-700">{appointment.completion_notes}</p>
                                                    </div>
                                                )}

                                                <div className="flex justify-end mt-4">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => window.location.href = `/tickets?ticket=${appointment.ticket.id}`}
                                                    >
                                                        Ver Ticket
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Upcoming Appointments */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Próximas Citas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {upcomingAppointments.length === 0 ? (
                                    <p className="text-gray-500 text-sm">No hay citas próximas</p>
                                ) : (
                                    <div className="space-y-3">
                                        {upcomingAppointments.slice(0, 5).map((appointment) => (
                                            <div key={appointment.id} className="border-l-4 border-blue-500 pl-3 py-2">
                                                <p className="font-medium text-sm">{appointment.title}</p>
                                                <p className="text-xs text-gray-600">
                                                    {formatDate(appointment.scheduled_for)} - {formatTime(appointment.scheduled_for)}
                                                </p>
                                                <p className="text-xs text-gray-500">{appointment.technical.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Estadísticas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Total hoy:</span>
                                        <span className="font-medium">{filteredAppointments.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Programadas:</span>
                                        <span className="font-medium text-blue-600">
                                            {appointments.filter(a => a.status === 'scheduled').length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">En progreso:</span>
                                        <span className="font-medium text-yellow-600">
                                            {appointments.filter(a => a.status === 'in_progress').length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Completadas:</span>
                                        <span className="font-medium text-green-600">
                                            {appointments.filter(a => a.status === 'completed').length}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Technicians */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Técnicos Disponibles</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {technicals.map((technical) => (
                                        <div key={technical.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <span className="text-sm font-medium">{technical.name}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {technical.shift}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
